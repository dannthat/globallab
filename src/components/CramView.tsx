import { AlertTriangle, ArrowRight, CheckCircle2, Gauge, MapPin } from 'lucide-react'
import type { Topic } from '../types'
import { HelpfulButton } from './HelpfulButton'

interface CramViewProps {
  topic: Topic
  isPreferred: boolean
  onMarkHelpful: () => void
}

export function CramView({ topic, isPreferred, onMarkHelpful }: CramViewProps) {
  return (
    <div className="space-y-5 animate-reveal">
      <section className="cram-definition">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#a84218]">
          <Gauge size={17} aria-hidden="true" />
          Key definition
        </div>
        <p className="mt-4 text-lg font-medium leading-8 tracking-[-0.015em] text-stone-900 sm:text-xl sm:leading-9">
          {topic.cram.definition}
        </p>
      </section>

      <section className="content-card" aria-labelledby="core-stages-heading">
        <div className="section-heading-row">
          <div>
            <p className="eyebrow">The pathway</p>
            <h3 id="core-stages-heading" className="section-title">
              Three core stages
            </h3>
          </div>
          <span className="section-meta">In order</span>
        </div>

        <ol className="mt-6 space-y-3">
          {topic.cram.stages.map((stage, index) => {
            const [name, detail = ''] = stage.split(' — ')
            return (
              <li key={stage} className="stage-row">
                <span className="stage-index">{index + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-stone-900">{name}</p>
                  <p className="mt-1 text-[15px] leading-6 text-stone-600">{detail}</p>
                </div>
                {index < topic.cram.stages.length - 1 && (
                  <ArrowRight className="hidden shrink-0 text-orange-300 sm:block" size={18} aria-hidden="true" />
                )}
              </li>
            )
          })}
        </ol>
      </section>

      <div className="grid gap-5 lg:grid-cols-5">
        <section className="content-card lg:col-span-3" aria-labelledby="exam-facts-heading">
          <div className="section-heading-row">
            <div>
              <p className="eyebrow">High yield</p>
              <h3 id="exam-facts-heading" className="section-title">
                Must-know exam facts
              </h3>
            </div>
            <CheckCircle2 className="text-orange-500" size={22} aria-hidden="true" />
          </div>
          <ul className="mt-5 space-y-3.5">
            {topic.cram.examFacts.map((fact) => (
              <li key={fact} className="fact-row">
                <span className="fact-dot" aria-hidden="true" />
                <span>{fact}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mistakes-card lg:col-span-2" aria-labelledby="mistakes-heading">
          <div className="flex items-center gap-2 text-amber-800">
            <AlertTriangle size={19} aria-hidden="true" />
            <h3 id="mistakes-heading" className="text-base font-semibold">
              Common exam mistakes
            </h3>
          </div>
          <ul className="mt-5 space-y-4">
            {topic.cram.commonMistakes.map((mistake) => (
              <li key={mistake} className="flex gap-3 text-sm leading-6 text-stone-700">
                <MapPin className="mt-1 shrink-0 text-amber-600" size={15} aria-hidden="true" />
                <span>{mistake}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <HelpfulButton mode="cram" isPreferred={isPreferred} onSave={onMarkHelpful} />
    </div>
  )
}
