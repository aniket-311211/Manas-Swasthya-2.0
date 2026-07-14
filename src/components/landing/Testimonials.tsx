import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { Quote } from 'lucide-react';
import Reveal from '@/components/visual/Reveal';

const QUOTES = [
  {
    text: 'During placement season I was a mess. Talking to Manas at 2 AM, without anyone knowing, honestly kept me going.',
    who: 'Final-year engineering student, Pune',
  },
  {
    text: 'The assessment felt like it actually listened. The questions changed based on what I said — not some generic form.',
    who: 'Second-year design student, Delhi',
  },
  {
    text: 'I started journaling with the mood tracker and for the first time I could see my anxiety patterns before exams.',
    who: 'MBBS student, Bhubaneswar',
  },
];

export default function Testimonials() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'center' });
  const [selected, setSelected] = useState(0);

  const onSelect = useCallback(() => {
    if (emblaApi) setSelected(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    const id = setInterval(() => emblaApi.scrollNext(), 6000);
    return () => {
      clearInterval(id);
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  return (
    <section id="stories" className="container mx-auto px-6 py-24">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-3xl text-foreground md:text-4xl">Students, in their own words</h2>
      </Reveal>
      <Reveal className="mx-auto mt-12 max-w-3xl">
        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex">
            {QUOTES.map((q) => (
              <figure key={q.who} className="min-w-0 flex-[0_0_100%] px-2">
                <blockquote className="glass-card relative rounded-3xl p-10 text-center">
                  <Quote className="mx-auto h-6 w-6 text-lavender" aria-hidden="true" />
                  <p className="mt-5 font-display text-xl leading-relaxed text-foreground md:text-2xl">
                    “{q.text}”
                  </p>
                  <figcaption className="mt-6 text-sm text-muted-foreground">{q.who}</figcaption>
                </blockquote>
              </figure>
            ))}
          </div>
        </div>
        <div className="mt-6 flex justify-center gap-2">
          {QUOTES.map((q, i) => (
            <button
              key={q.who}
              type="button"
              aria-label={`Go to story ${i + 1}`}
              onClick={() => emblaApi?.scrollTo(i)}
              className={`h-2 rounded-full transition-all ${
                selected === i ? 'w-6 bg-sage' : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
              }`}
            />
          ))}
        </div>
      </Reveal>
    </section>
  );
}
