/**
 * Two crop icons Lucide does not have, drawn in the same style
 * (24 px grid, 2 px round stroke, currentColor).
 */
interface IconProps {
  size?: number
  className?: string
}

function Svg({ size = 24, className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {children}
    </svg>
  )
}

/** Maize: a cob with kernels and two husk leaves. */
export function MaizeIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 2.5c2.3 0 3.6 3.2 3.6 7.3S14.3 17 12 17s-3.6-3.1-3.6-7.2S9.7 2.5 12 2.5Z" />
      <path d="M9.2 7h5.6M8.6 10.3h6.8M9.2 13.6h5.6M12 3v13.8" />
      <path d="M8.4 12.5C6 13.6 4.8 16.8 5 21.5c3-1.2 5.3-2.8 7-4.5" />
      <path d="M15.6 12.5c2.4 1.1 3.6 4.3 3.4 9-3-1.2-5.3-2.8-7-4.5" />
    </Svg>
  )
}

/** Barley: a stem with paired grains and long awns, unlike the wheat icon. */
export function BarleyIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 22V7" />
      <path d="M12 9 9.6 6.8M12 12.2 9.6 10M12 15.4l-2.4-2.2M12 9l2.4-2.2M12 12.2l2.4-2.2M12 15.4l2.4-2.2" />
      <path d="M9.6 6.8 6.5 2M14.4 6.8 17.5 2M12 7V1.8M9.6 10 5.5 6.5M14.4 10l4.1-3.5" />
    </Svg>
  )
}

/** Potato: a lumpy tuber with eyes. */
export function PotatoIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6.5 7.5C8.8 4 14.5 3.2 17.8 6c3.3 2.8 3.3 8.3.2 11.3-3.1 3-9 3.6-12 .8C3 15.4 4.3 10.8 6.5 7.5Z" />
      <path d="M9.5 9.5h.01M14 8.5h.01M15.5 13.5h.01M10.5 14.5h.01" strokeWidth={2.6} />
    </Svg>
  )
}
