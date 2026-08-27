// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  ActionPotentialSim,
  ChemicalEquilibriumSim,
  EnzymeKineticsSim,
  getSimulationRegistration,
  hasInteractiveSimulation,
  WaveInterferenceSim,
} from '.'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('interactive STEM simulations', () => {
  it('maps supported textbook sections and supplies static fallbacks', () => {
    const doubleSlit = getSimulationRegistration(
      'wave-mechanics',
      'double-slit',
    )

    expect(doubleSlit?.Component).toBe(WaveInterferenceSim)
    expect(doubleSlit?.fallbackDiagram?.url).toContain('wave-interference')
    expect(hasInteractiveSimulation('enzyme-kinetics', 'inhibition')).toBe(true)
    expect(hasInteractiveSimulation('wave-mechanics', 'overview')).toBe(true)
  })

  it('updates Michaelis–Menten velocity and inhibitor parameters', async () => {
    const user = userEvent.setup()
    render(<EnzymeKineticsSim />)

    expect(screen.getByTestId('enzyme-velocity').textContent).toContain('46.7')

    fireEvent.change(screen.getByRole('slider', { name: /Substrate/ }), {
      target: { value: '40' },
    })
    expect(screen.getByTestId('enzyme-velocity').textContent).toContain('58.3')

    const competitive = screen.getByRole('button', {
      name: /^Competitive inhibitor/i,
    })
    await user.click(competitive)
    expect(competitive.getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByText('16.0 mM')).toBeTruthy()
  })

  it('distinguishes subthreshold input from an all-or-none action potential', async () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({
        matches: true,
        media: '(prefers-reduced-motion: reduce)',
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    )
    const user = userEvent.setup()
    render(<ActionPotentialSim />)

    const stimulus = screen.getByRole('slider', {
      name: /Stimulus voltage/,
    })
    fireEvent.change(stimulus, { target: { value: '-60' } })
    expect(screen.getByText('No action potential')).toBeTruthy()

    fireEvent.change(stimulus, { target: { value: '-50' } })
    await user.click(screen.getByRole('button', { name: /Trigger pulse/i }))
    expect(screen.getByText('All-or-none pulse')).toBeTruthy()
    expect(screen.getByTestId('action-phase').textContent).toContain(
      'Resting restored',
    )
  })

  it('cancels an active action-potential animation frame on unmount', async () => {
    const requestFrame = vi.fn(() => 73)
    const cancelFrame = vi.fn()
    vi.stubGlobal('requestAnimationFrame', requestFrame)
    vi.stubGlobal('cancelAnimationFrame', cancelFrame)
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({
        matches: false,
        media: '(prefers-reduced-motion: reduce)',
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    )
    const user = userEvent.setup()
    const { unmount } = render(<ActionPotentialSim />)

    await user.click(screen.getByRole('button', { name: /Trigger Pulse/i }))
    expect(requestFrame).toHaveBeenCalledOnce()

    unmount()
    expect(cancelFrame).toHaveBeenCalledWith(73)
  })

  it('scales the wave Canvas for HiDPI and calculates lambda L over d', () => {
    const context = {
      beginPath: vi.fn(),
      clearRect: vi.fn(),
      fillRect: vi.fn(),
      fillText: vi.fn(),
      lineTo: vi.fn(),
      moveTo: vi.fn(),
      setTransform: vi.fn(),
      stroke: vi.fn(),
      fillStyle: '',
      font: '',
      globalAlpha: 1,
      lineWidth: 1,
      strokeStyle: '',
      textAlign: 'start',
    }
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      context as unknown as CanvasRenderingContext2D,
    )
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      width: 600,
      height: 246,
      top: 0,
      right: 600,
      bottom: 246,
      left: 0,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })
    vi.stubGlobal('devicePixelRatio', 2)

    render(<WaveInterferenceSim />)

    expect(context.setTransform).toHaveBeenCalledWith(2, 0, 0, 2, 0, 0)
    expect(screen.getByTestId('fringe-spacing').textContent).toContain('2.70')

    fireEvent.change(screen.getByRole('slider', { name: /Wavelength/ }), {
      target: { value: '600' },
    })
    fireEvent.change(screen.getByRole('slider', { name: /Slit separation/ }), {
      target: { value: '0.3' },
    })
    fireEvent.change(screen.getByRole('slider', { name: /Screen distance/ }), {
      target: { value: '3' },
    })
    expect(screen.getByTestId('fringe-spacing').textContent).toContain('6.00')
  })

  it('shows the qualitative Q versus Keq response to reactor disturbances', async () => {
    const user = userEvent.setup()
    render(<ChemicalEquilibriumSim />)

    expect(screen.getByTestId('q-k-relation').textContent).toContain('Q ≈ K')

    await user.click(
      screen.getByRole('button', { name: /Increase temperature/i }),
    )
    expect(screen.getByTestId('q-k-relation').textContent).toContain('Q > K')
    expect(screen.getByText(/Shifts left toward/)).toBeTruthy()

    await user.click(
      screen.getByRole('button', { name: /Increase pressure/i }),
    )
    expect(screen.getByTestId('q-k-relation').textContent).toContain(
      'Compare Q with the new K',
    )
    expect(screen.getByText(/Competing disturbances/)).toBeTruthy()

    await user.click(
      screen.getByRole('button', { name: /Increase temperature/i }),
    )
    await user.click(screen.getByRole('button', { name: /Add reactant/i }))
    expect(screen.getByTestId('q-k-relation').textContent).toContain('Q < K')
    expect(screen.getByText(/Shifts right toward/)).toBeTruthy()
  })
})
