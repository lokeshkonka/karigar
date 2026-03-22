'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { Star, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';

interface ExistingReview {
  id: string;
  overall_rating: number | null;
  mechanic_rating: number | null;
  comment: string | null;
}

interface MechanicProfile {
  id: string;
  name: string;
  role: string | null;
}

interface ReviewableWorkOrder {
  id: string;
  type: string;
  plate: string | null;
  created_at: string;
  assigned_mechanic_id: string | null;
  mechanic: MechanicProfile | null;
  existingReview: ExistingReview | null;
}

function StarRating({ rating, onRate }: { rating: number; onRate: (n: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          onClick={() => onRate(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          className="transition-transform hover:scale-110 active:scale-95"
        >
          <Star
            size={36}
            strokeWidth={2}
            className={`transition-colors ${n <= (hover || rating) ? 'fill-electricYellow text-electricYellow' : 'text-gray-300'}`}
          />
        </button>
      ))}
    </div>
  );
}

export default function ReviewPage() {
  const { user, isLoading: authLoading } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [customerName, setCustomerName] = useState('Customer');
  const [workOrders, setWorkOrders] = useState<ReviewableWorkOrder[]>([]);
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState('');
  const [overallRating, setOverallRating] = useState(0);
  const [mechanicRating, setMechanicRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    async function loadReviewContext() {
      if (authLoading) return;

      setLoading(true);

      if (!user?.email) {
        setWorkOrders([]);
        setLoading(false);
        return;
      }

      const { data: customer } = await supabase
        .from('customers')
        .select('id, name')
        .eq('email', user.email)
        .maybeSingle();

      if (!customer) {
        setLoading(false);
        return;
      }

      setCustomerName(customer.name || user.name || 'Customer');

      const { data: orders } = await supabase
        .from('work_orders')
        .select('id, type, plate, created_at, assigned_mechanic_id, status')
        .eq('customer_id', customer.id)
        .in('status', ['READY', 'DELIVERED'])
        .order('created_at', { ascending: false })
        .limit(20);

      if (!orders || orders.length === 0) {
        setWorkOrders([]);
        setLoading(false);
        return;
      }

      const workOrderIds = orders.map((order) => order.id);
      const mechanicIds = [...new Set(orders.map((order) => order.assigned_mechanic_id).filter(Boolean))] as string[];

      const [{ data: reviewRows }, { data: mechanicRows }] = await Promise.all([
        supabase
          .from('reviews')
          .select('id, work_order_id, overall_rating, mechanic_rating, comment')
          .in('work_order_id', workOrderIds),
        mechanicIds.length > 0
          ? supabase.from('staff_profiles').select('id, name, role').in('id', mechanicIds)
          : Promise.resolve({ data: [] as MechanicProfile[] }),
      ]);

      const reviewByWorkOrder = new Map<string, ExistingReview>();
      (reviewRows || []).forEach((review) => {
        if (review.work_order_id && !reviewByWorkOrder.has(review.work_order_id)) {
          reviewByWorkOrder.set(review.work_order_id, {
            id: review.id,
            overall_rating: review.overall_rating,
            mechanic_rating: review.mechanic_rating,
            comment: review.comment,
          });
        }
      });

      const mechanicById = new Map<string, MechanicProfile>();
      (mechanicRows || []).forEach((mechanic) => {
        mechanicById.set(mechanic.id, mechanic);
      });

      const mappedOrders: ReviewableWorkOrder[] = orders.map((order) => ({
        id: order.id,
        type: order.type,
        plate: order.plate,
        created_at: order.created_at,
        assigned_mechanic_id: order.assigned_mechanic_id,
        mechanic: order.assigned_mechanic_id ? mechanicById.get(order.assigned_mechanic_id) || null : null,
        existingReview: reviewByWorkOrder.get(order.id) || null,
      }));

      setWorkOrders(mappedOrders);

      const firstPending = mappedOrders.find((order) => !order.existingReview);
      setSelectedWorkOrderId((firstPending || mappedOrders[0]).id);
      setLoading(false);
    }

    loadReviewContext();
  }, [user, authLoading]);

  const selectedOrder = useMemo(
    () => workOrders.find((order) => order.id === selectedWorkOrderId) || null,
    [workOrders, selectedWorkOrderId]
  );

  useEffect(() => {
    if (!selectedOrder) return;
    if (selectedOrder.existingReview) {
      setOverallRating(selectedOrder.existingReview.overall_rating || 0);
      setMechanicRating(selectedOrder.existingReview.mechanic_rating || 0);
      setComment(selectedOrder.existingReview.comment || '');
      return;
    }

    setOverallRating(0);
    setMechanicRating(0);
    setComment('');
  }, [selectedOrder]);

  const handleSubmit = async () => {
    if (!selectedOrder) {
      toast.error('No service available to review yet');
      return;
    }

    if (overallRating === 0) {
      toast.error('Please rate your overall experience');
      return;
    }

    if (selectedOrder.assigned_mechanic_id && mechanicRating === 0) {
      toast.error('Please rate your technician');
      return;
    }

    setSubmitting(true);

    const payload = {
      work_order_id: selectedOrder.id,
      customer_name: customerName,
      mechanic_id: selectedOrder.assigned_mechanic_id,
      overall_rating: overallRating,
      mechanic_rating: selectedOrder.assigned_mechanic_id ? mechanicRating : null,
      comment: comment.trim() ? comment.trim() : null,
    };

    let dbError: { message?: string } | null = null;

    if (selectedOrder.existingReview?.id) {
      const { error } = await supabase
        .from('reviews')
        .update(payload)
        .eq('id', selectedOrder.existingReview.id);
      dbError = error;
    } else {
      const { error } = await supabase.from('reviews').insert(payload);
      dbError = error;
    }

    if (dbError) {
      toast.error(dbError.message || 'Unable to submit review');
      setSubmitting(false);
      return;
    }

    setSubmitted(true);
    toast.success('Thank you for your feedback! 🌟', { duration: 3500 });
    setTimeout(() => router.push('/portal/home'), 2500);
  };

  if (loading || authLoading) return <Loader />;

  if (workOrders.length === 0) {
    return (
      <div className="space-y-4">
        <div className="border-b-4 border-[#1a1a1a] pb-4">
          <h1 className="text-3xl font-black uppercase tracking-widest">Rate Your Visit</h1>
          <p className="text-sm font-bold text-gray-500">Reviews unlock after a READY or DELIVERED job</p>
        </div>
        <Card className="border-4 border-dashed border-gray-400 text-center py-10">
          <p className="font-black uppercase tracking-widest text-[#1a1a1a]">No completed services yet</p>
          <p className="text-sm font-bold text-gray-500 mt-2">Once your service is completed, you can submit a review here.</p>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-in zoom-in-90">
        <div className="w-24 h-24 bg-electricYellow border-4 border-[#1a1a1a] flex items-center justify-center">
          <Star size={52} className="fill-[#1a1a1a] text-[#1a1a1a]" />
        </div>
        <h2 className="text-4xl font-black uppercase tracking-widest">Review Submitted!</h2>
        <p className="font-bold text-gray-600">Your feedback helps us serve better.</p>
        <div className="flex gap-2 justify-center">
          {[...Array(overallRating)].map((_, i) => (
            <Star key={i} size={28} className="fill-electricYellow text-electricYellow" />
          ))}
        </div>
        <p className="text-sm font-bold text-gray-400">Redirecting to home...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="border-b-4 border-[#1a1a1a] pb-4">
        <h1 className="text-3xl font-black uppercase tracking-widest">Rate Your Visit</h1>
        <p className="text-sm font-bold text-gray-500">Your feedback is visible to technicians and admins</p>
      </div>

      <div>
        <label className="block font-black uppercase text-sm tracking-widest mb-2">Select Service</label>
        <select
          value={selectedWorkOrderId}
          onChange={(e) => setSelectedWorkOrderId(e.target.value)}
          className="w-full p-3 bg-white border-2 border-[#1a1a1a] font-bold focus:outline-none focus:ring-2 focus:ring-electricYellow"
        >
          {workOrders.map((order) => (
            <option key={order.id} value={order.id}>
              {order.plate || 'Unknown Plate'} · {order.type} · {new Date(order.created_at).toLocaleDateString()} {order.existingReview ? '(editing review)' : '(new)'}
            </option>
          ))}
        </select>
      </div>

      {/* Overall Rating */}
      <Card className="bg-electricYellow text-[#1a1a1a] border-4 border-[#1a1a1a] shadow-[6px_6px_0px_#1a1a1a]">
        <h3 className="font-black uppercase text-sm tracking-widest text-[#1a1a1a]/80 mb-3">Overall Experience</h3>
        <StarRating rating={overallRating} onRate={setOverallRating} />
        <p className="mt-3 font-black text-[#1a1a1a] text-lg">
          {overallRating === 0 && 'Tap a star to rate'}
          {overallRating === 1 && 'Poor 😟'}
          {overallRating === 2 && 'Below Average 😐'}
          {overallRating === 3 && 'Average 🙂'}
          {overallRating === 4 && 'Good 😊'}
          {overallRating === 5 && 'Excellent! 🌟'}
        </p>
      </Card>

      {/* Mechanic Ratings */}
      {selectedOrder?.mechanic && (
        <section className="space-y-4">
          <h2 className="font-black text-sm uppercase tracking-widest text-[#1a1a1a] border-b-2 border-dashed border-gray-300 pb-2">
            Rate Your Technician
          </h2>
          <Card className="flex items-center gap-4">
            <div className="w-12 h-12 bg-cream border-2 border-[#1a1a1a] shrink-0 flex items-center justify-center font-black text-xl">
              {selectedOrder.mechanic.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-black uppercase leading-none">{selectedOrder.mechanic.name}</h3>
              <p className="text-xs text-gray-500 font-bold">{selectedOrder.mechanic.role || 'Technician'}</p>
              <div className="mt-2">
                <StarRating rating={mechanicRating} onRate={setMechanicRating} />
              </div>
            </div>
          </Card>
        </section>
      )}

      {/* Comment */}
      <div>
        <label className="block font-black uppercase text-sm tracking-widest mb-2">Additional Comments (optional)</label>
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          rows={4}
          placeholder="Tell us about your experience, any suggestions..."
          className="w-full p-4 bg-white border-2 border-[#1a1a1a] font-bold resize-none focus:outline-none focus:ring-2 focus:ring-electricYellow"
        />
        <p className="text-xs text-gray-400 font-bold mt-1 text-right">{comment.length}/500</p>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full py-5 bg-electricYellow border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] font-black uppercase text-lg tracking-wider flex items-center justify-center gap-3 hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
      >
        <Send size={22} strokeWidth={2.5} /> {submitting ? 'Submitting...' : 'Submit Review'}
      </button>
    </div>
  );
}
