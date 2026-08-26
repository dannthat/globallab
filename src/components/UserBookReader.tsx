import { lazy, Suspense } from 'react'
import type { UserBookReaderProps } from './UserBookReaderCore'

const LazyUserBookReader = lazy(() =>
  import('./UserBookReaderCore').then((module) => ({
    default: module.UserBookReader,
  })),
)

export function UserBookReader(props: UserBookReaderProps) {
  return (
    <Suspense
      fallback={
        <main className='app-shell ubr-lazy-loading' role='status'>
          <span className='ubr-loading-spinner' aria-hidden='true' />
          <p>Opening your source reader…</p>
        </main>
      }
    >
      <LazyUserBookReader {...props} />
    </Suspense>
  )
}
