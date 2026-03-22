'use client';

import React, { useState, useEffect } from 'react';
import { Loader } from '@/components/ui/Loader';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { Star, MessageSquare } from 'lucide-react';

interface Review {
  id: string;
  customer_name: string;
  overall_rating: number;
  mechanic_rating: number | null;
  comment: string | null;
  created_at: string;
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star
          key={n}
          size={16}
          className={n <= rating ? 'fill-electricYellow text-electricYellow' : 'text-gray-700'}
        />
      ))}
    </div>
  );
}

export default function StaffReviewsPage() {
  const { user } = useAuthStore();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user?.email) return;
      const { data: profile } = await supabase
        .from('staff_profiles')
        .select('id')
        .eq('email', user.email)
        .maybeSingle();

      if (!profile) { setLoading(false); return; }

      const { data } = await supabase
        .from('reviews')
        .select('*')
        .eq('mechanic_id', profile.id)
        .order('created_at', { ascending: false });
      setReviews(data || []);
      setLoading(false);
    }
    load();
  }, [user]);

  const displayReviews = reviews;
  const mechanicScores = displayReviews
    .map((review) => review.mechanic_rating ?? review.overall_rating)
    .filter((rating): rating is number => typeof rating === 'number' && rating > 0);
  const avgMechanic = mechanicScores.length > 0 ? mechanicScores.reduce((sum, rating) => sum + rating, 0) / mechanicScores.length : 0;

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      <div className="border-b-4 border-[#1a1a1a] pb-4">
        <h2 className="text-3xl font-black uppercase tracking-widest text-[#1a1a1a]">My Reviews</h2>
        <p className="text-sm font-bold text-gray-500">{displayReviews.length} customer reviews</p>
      </div>

      {loading ? (
        <Loader />
      ) : (
        <>
          {/* Summary */}
          <div className="bg-electricYellow border-4 border-[#1a1a1a] shadow-[6px_6px_0_#1a1a1a] p-6 flex flex-col md:flex-row items-center gap-6">
            <div className="text-center md:text-left">
              <p className="text-6xl font-black text-[#1a1a1a] mb-2">{avgMechanic.toFixed(1)}</p>
              <Stars rating={Math.round(avgMechanic)} />
            </div>
            <div className="text-center md:text-left">
              <p className="text-xl font-black uppercase text-[#1a1a1a]">Your Average Rating</p>
              <p className="font-bold text-sm text-[#1a1a1a]/70">Based on {displayReviews.length} reviews</p>
            </div>
          </div>

          {/* Reviews list */}
          <div className="space-y-4 mt-8">
            {displayReviews.map(r => (
              <div key={r.id} className="bg-white border-4 border-[#1a1a1a] shadow-[4px_4px_0_#1a1a1a] p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-electricYellow border-2 border-[#1a1a1a] text-[#1a1a1a] flex items-center justify-center font-black text-xl">
                      {r.customer_name[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-black text-[#1a1a1a] text-lg uppercase">{r.customer_name}</p>
                      <p className="text-xs font-bold text-gray-500">{new Date(r.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Your Rating</p>
                    <Stars rating={r.mechanic_rating ?? r.overall_rating} />
                  </div>
                </div>
                
                {r.comment && (
                  <div className="flex gap-3 bg-cream border-2 border-[#1a1a1a] p-4 mt-4">
                    <MessageSquare size={20} className="text-[#1a1a1a] shrink-0 mt-0.5" />
                    <p className="text-sm font-bold text-gray-700 italic">&ldquo;{r.comment}&rdquo;</p>
                  </div>
                )}
                
                <div className="flex items-center gap-3 text-xs pt-4 border-t-2 border-dashed border-gray-300 mt-4">
                  <span className="text-gray-500 font-black uppercase tracking-wider">Overall Garage Rating:</span>
                  <Stars rating={r.overall_rating} />
                </div>
              </div>
            ))}
            {displayReviews.length === 0 && (
              <p className="p-8 text-center bg-cream border-4 border-dashed border-gray-300 text-gray-500 font-bold uppercase tracking-widest">
                No reviews yet
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
