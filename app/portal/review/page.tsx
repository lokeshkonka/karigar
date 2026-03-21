'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Star, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

const MECHANICS = [
  { id: 'TECH-001', name: 'Marcus Vance', role: 'Head Mechanic' },
  { id: 'TECH-002', name: 'Sarah Jenkins', role: 'Diagnostic Specialist' },
];

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
  const router = useRouter();
  const [overallRating, setOverallRating] = useState(0);
  const [mechanicRatings, setMechanicRatings] = useState<Record<string, number>>({});
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (overallRating === 0) {
      toast.error('Please rate your overall experience');
      return;
    }
    setSubmitted(true);
    toast.success('Thank you for your feedback! 🌟', { duration: 4000 });
    setTimeout(() => router.push('/portal/home'), 2500);
  };

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
        <p className="text-sm font-bold text-gray-500">Service #INV-001 · MH 12 AB 1234</p>
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
      <section className="space-y-4">
        <h2 className="font-black text-sm uppercase tracking-widest text-[#1a1a1a] border-b-2 border-dashed border-gray-300 pb-2">
          Rate Your Mechanics
        </h2>
        {MECHANICS.map(mech => (
          <Card key={mech.id} className="flex items-center gap-4">
            <div className="w-12 h-12 bg-cream border-2 border-[#1a1a1a] shrink-0 flex items-center justify-center font-black text-xl">
              {mech.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-black uppercase leading-none">{mech.name}</h3>
              <p className="text-xs text-gray-500 font-bold">{mech.role}</p>
              <div className="mt-2">
                <StarRating
                  rating={mechanicRatings[mech.id] || 0}
                  onRate={(n) => setMechanicRatings(prev => ({ ...prev, [mech.id]: n }))}
                />
              </div>
            </div>
          </Card>
        ))}
      </section>

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
        className="w-full py-5 bg-electricYellow border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] font-black uppercase text-lg tracking-wider flex items-center justify-center gap-3 hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
      >
        <Send size={22} strokeWidth={2.5} /> Submit Review
      </button>
    </div>
  );
}
