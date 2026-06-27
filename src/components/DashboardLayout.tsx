interface Props {
  header: React.ReactNode
  children: React.ReactNode
}

export default function DashboardLayout({ header, children }: Props) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      {header}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {children}
      </div>
    </div>
  )
}
