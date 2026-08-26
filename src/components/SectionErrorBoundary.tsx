import { CircleAlert, RotateCcw } from 'lucide-react'
import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AnalogyCard } from './AnalogyCard'

interface SectionErrorBoundaryProps {
  children: ReactNode
  error: string | null
  neutralAnalogy: string
  onRetry: () => void
}

interface SectionErrorBoundaryState {
  hasRenderError: boolean
}

export class SectionErrorBoundary extends Component<
  SectionErrorBoundaryProps,
  SectionErrorBoundaryState
> {
  state: SectionErrorBoundaryState = { hasRenderError: false }

  static getDerivedStateFromError(): SectionErrorBoundaryState {
    return { hasRenderError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Section personalization render failed:', error, info)
  }

  private retry = () => {
    this.setState({ hasRenderError: false })
    this.props.onRetry()
  }

  render() {
    const hasFailed = this.state.hasRenderError || Boolean(this.props.error)
    if (!hasFailed) return this.props.children

    return (
      <div className="section-error-fallback" role="alert">
        <div className="section-error-heading">
          <CircleAlert size={15} aria-hidden="true" />
          Learn Your Way paused
        </div>
        <p className="section-error-copy">
          We could not create the requested help. The original explanation above
          is unchanged; this neutral source-based bridge is available instead.
        </p>
        <AnalogyCard analogy={this.props.neutralAnalogy} persona="neutral" />
        {this.props.error && (
          <p className="section-error-detail">{this.props.error}</p>
        )}
        <button type="button" className="section-retry-button" onClick={this.retry}>
          <RotateCcw size={12} aria-hidden="true" />
          Try again
        </button>
      </div>
    )
  }
}
