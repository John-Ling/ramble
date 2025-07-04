import SettingsMenu from "./settings_menu"
import { Button } from "../ui/button"
import { Settings } from "lucide-react"

export default function Menubar() {
  return (
    <>
      <div className="flex w-full justify-center">
        <div className="flex w-3/4 justify-between">
          <h1 className="font-bold text-2xl">Ramble</h1>
          <SettingsMenu />
        </div>
      </div>
    </>
  )
}