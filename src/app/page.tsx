import DashboardLayout from "@/components/DashboardLayout"
import HeaderStrip from "@/components/HeaderStrip"
import PrayerTimes from "@/components/PrayerTimes"
import WeatherWidget from "@/components/WeatherWidget"

export default function Home() {
  return (
    <DashboardLayout header={<HeaderStrip />}>
      <PrayerTimes />
      <WeatherWidget />
    </DashboardLayout>
  )
}
