import { Globe, Lightbulb, Sparkles } from 'lucide-react'
import type { ComponentType } from 'react'
import type { KnowledgeCallout } from '../types'

interface CalloutBoxProps {
  callout: KnowledgeCallout
}

const calloutStyles: Record<
  KnowledgeCallout['type'],
  { Icon: ComponentType<{ className?: string; size?: number }>; iconClass: string }
> = {
  'key-insight': { Icon: Lightbulb, iconClass: 'callout-icon-blue' },
  'real-world': { Icon: Globe, iconClass: 'callout-icon-emerald' },
  'did-you-know': { Icon: Sparkles, iconClass: 'callout-icon-amber' },
}

export function CalloutBox({ callout }: CalloutBoxProps) {
  const { Icon, iconClass } = calloutStyles[callout.type]

  return (
    <aside className={'callout callout-' + callout.type}>
      <Icon className={'callout-icon ' + iconClass} size={16} />
      <div>
        <p className={'callout-heading ' + iconClass}>{callout.heading}</p>
        <p className="callout-body">{callout.body}</p>
      </div>
    </aside>
  )
}
