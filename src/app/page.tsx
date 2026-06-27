import HeaderStrip from "@/components/HeaderStrip"
import PrayerTimes from "@/components/PrayerTimes"
import WeatherWidget from "@/components/WeatherWidget"
import ShiftTracker from "@/components/ShiftTracker"
import TodoList from "@/components/TodoList"
import UpcomingEvents from "@/components/UpcomingEvents"
import PortfolioTracker from "@/components/PortfolioTracker"
import BillsTracker from "@/components/BillsTracker"
import BudgetSnapshot from "@/components/BudgetSnapshot"

export default function Home() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      <HeaderStrip />

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <PrayerTimes />
        <WeatherWidget />
      </div>

      <div className="mt-6">
        <ShiftTracker />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TodoList />
        <UpcomingEvents />
      </div>

      <div className="mt-6">
        <PortfolioTracker />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <BillsTracker />
        <BudgetSnapshot />
      </div>
    </div>
  )
}
