'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { MessageSquare, Star, UserSquare2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ReviewRow {
  id: string;
  work_order_id: string | null;
  mechanic_id: string | null;
  customer_name: string | null;
  overall_rating: number | null;
  mechanic_rating: number | null;
  comment: string | null;
  created_at: string;
}

interface MechanicRow {
  id: string;
  name: string;
  role: string | null;
}

interface WorkOrderRow {
  id: string;
  type: string | null;
  plate: string | null;
}

interface EnrichedReview extends ReviewRow {
  mechanicName: string;
  mechanicRole: string;
  serviceType: string;
  plate: string;
  effectiveMechanicRating: number;
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={16}
          className={n <= rating ? 'fill-electricYellow text-electricYellow' : 'text-gray-300'}
        />
      ))}
    </div>
  );
}

export default function AdminReviewsPage() {
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<EnrichedReview[]>([]);

  useEffect(() => {
    async function loadReviews() {
      const { data: reviewRows } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });

      const safeReviewRows: ReviewRow[] = reviewRows || [];
      if (safeReviewRows.length === 0) {
        setReviews([]);
        setLoading(false);
        return;
      }

      const mechanicIds = [...new Set(safeReviewRows.map((review) => review.mechanic_id).filter(Boolean))] as string[];
      const workOrderIds = [...new Set(safeReviewRows.map((review) => review.work_order_id).filter(Boolean))] as string[];

      const [{ data: mechanicRows }, { data: workOrderRows }] = await Promise.all([
        mechanicIds.length > 0
          ? supabase.from('staff_profiles').select('id, name, role').in('id', mechanicIds)
          : Promise.resolve({ data: [] as MechanicRow[] }),
        workOrderIds.length > 0
          ? supabase.from('work_orders').select('id, type, plate').in('id', workOrderIds)
          : Promise.resolve({ data: [] as WorkOrderRow[] }),
      ]);

      const mechanicById = new Map<string, MechanicRow>();
      (mechanicRows || []).forEach((mechanic) => mechanicById.set(mechanic.id, mechanic));

      const workOrderById = new Map<string, WorkOrderRow>();
      (workOrderRows || []).forEach((workOrder) => workOrderById.set(workOrder.id, workOrder));

      const enriched: EnrichedReview[] = safeReviewRows.map((review) => {
        const mechanic = review.mechanic_id ? mechanicById.get(review.mechanic_id) : null;
        const workOrder = review.work_order_id ? workOrderById.get(review.work_order_id) : null;
        const effectiveMechanicRating = review.mechanic_rating ?? review.overall_rating ?? 0;

        return {
          ...review,
          mechanicName: mechanic?.name || 'Unassigned',
          mechanicRole: mechanic?.role || 'TECHNICIAN',
          serviceType: workOrder?.type || 'General Service',
          plate: workOrder?.plate || 'N/A',
          effectiveMechanicRating,
        };
      });

      setReviews(enriched);
      setLoading(false);
    }

    loadReviews();
  }, []);

  const avgOverall = useMemo(() => {
    const values = reviews.map((review) => review.overall_rating ?? 0).filter((value) => value > 0);
    if (values.length === 0) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }, [reviews]);

  const avgMechanic = useMemo(() => {
    const values = reviews.map((review) => review.effectiveMechanicRating).filter((value) => value > 0);
    if (values.length === 0) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }, [reviews]);

  const topTechnicians = useMemo(() => {
    const byTechnician = new Map<string, { name: string; total: number; count: number }>();

    reviews.forEach((review) => {
      if (review.mechanicName === 'Unassigned' || review.effectiveMechanicRating === 0) return;
      const existing = byTechnician.get(review.mechanicName);
      if (existing) {
        existing.total += review.effectiveMechanicRating;
        existing.count += 1;
        return;
      }
      byTechnician.set(review.mechanicName, {
        name: review.mechanicName,
        total: review.effectiveMechanicRating,
        count: 1,
      });
    });

    return Array.from(byTechnician.values())
      .map((item) => ({
        name: item.name,
        count: item.count,
        avg: item.total / item.count,
      }))
      .sort((a, b) => b.avg - a.avg || b.count - a.count)
      .slice(0, 5);
  }, [reviews]);

  if (loading) return <Loader />;

  return (
    <div className="space-y-8 animate-in fade-in pb-12">
      <div className="border-b-4 border-[#1a1a1a] pb-4">
        <h1 className="text-4xl font-black uppercase tracking-widest text-[#1a1a1a]">Customer Reviews</h1>
        <p className="font-bold text-gray-500 mt-2">{reviews.length} submitted reviews</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="border-4 border-[#1a1a1a]">
          <p className="text-xs font-black uppercase tracking-widest text-gray-500">Overall Experience</p>
          <p className="text-5xl font-black text-[#1a1a1a] mt-2">{avgOverall.toFixed(1)}</p>
          <div className="mt-2"><Stars rating={Math.round(avgOverall)} /></div>
        </Card>
        <Card className="border-4 border-[#1a1a1a] bg-electricYellow">
          <p className="text-xs font-black uppercase tracking-widest text-[#1a1a1a]/70">Technician Average</p>
          <p className="text-5xl font-black text-[#1a1a1a] mt-2">{avgMechanic.toFixed(1)}</p>
          <div className="mt-2"><Stars rating={Math.round(avgMechanic)} /></div>
        </Card>
        <Card className="border-4 border-[#1a1a1a]">
          <p className="text-xs font-black uppercase tracking-widest text-gray-500">Feedback Notes</p>
          <p className="text-5xl font-black text-[#1a1a1a] mt-2">{reviews.filter((review) => !!review.comment).length}</p>
          <p className="text-sm font-bold text-gray-500 mt-2">Reviews that include written comments</p>
        </Card>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-black uppercase tracking-wider border-b-2 border-dashed border-gray-300 pb-2">
          Top Rated Technicians
        </h2>
        {topTechnicians.length === 0 ? (
          <Card className="border-4 border-dashed border-gray-300 text-center py-8">
            <p className="font-black uppercase tracking-widest text-gray-500">No technician ratings yet</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topTechnicians.map((tech) => (
              <Card key={tech.name} className="border-4 border-[#1a1a1a]">
                <p className="font-black uppercase text-lg text-[#1a1a1a]">{tech.name}</p>
                <p className="text-xs font-bold text-gray-500">{tech.count} reviews</p>
                <p className="text-3xl font-black text-[#1a1a1a] mt-2">{tech.avg.toFixed(1)}</p>
                <div className="mt-1"><Stars rating={Math.round(tech.avg)} /></div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-black uppercase tracking-wider border-b-2 border-dashed border-gray-300 pb-2">
          Latest Feedback
        </h2>
        {reviews.length === 0 ? (
          <Card className="border-4 border-dashed border-gray-300 text-center py-10">
            <p className="font-black uppercase tracking-widest text-gray-500">No reviews yet</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <Card key={review.id} className="border-4 border-[#1a1a1a] space-y-4">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                  <div>
                    <p className="font-black uppercase text-[#1a1a1a] text-lg">{review.customer_name || 'Customer'}</p>
                    <p className="text-xs font-bold text-gray-500">
                      {new Date(review.created_at).toLocaleDateString()} · {review.plate} · {review.serviceType}
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <div>
                      <p className="text-[10px] uppercase font-black text-gray-500 mb-1">Overall</p>
                      <Stars rating={review.overall_rating ?? 0} />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-black text-gray-500 mb-1">Technician</p>
                      <Stars rating={review.effectiveMechanicRating} />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-gray-500">
                  <UserSquare2 size={14} />
                  {review.mechanicName} · {review.mechanicRole}
                </div>

                {review.comment && (
                  <div className="flex gap-3 bg-cream border-2 border-[#1a1a1a] p-4">
                    <MessageSquare size={18} className="text-[#1a1a1a] mt-0.5 shrink-0" />
                    <p className="font-bold text-sm text-gray-700 italic">&ldquo;{review.comment}&rdquo;</p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
