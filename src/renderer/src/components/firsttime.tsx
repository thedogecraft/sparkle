import { useEffect, useState } from "react"
import Modal from "@/components/ui/modal"
import Button from "./ui/button"
import { toast } from "react-toastify"
import { invoke } from "@/lib/electron"
import data from "../../../../package.json"
import { useTranslation } from "react-i18next"

export default function FirstTime(): React.ReactElement {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const firstTime = localStorage.getItem("firstTime")
    if (!firstTime || firstTime === "true") {
      const timer = setTimeout(() => setOpen(true), 20)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [])

  const handleGetStarted = async () => {
    localStorage.setItem("firstTime", "false")
    setOpen(false)

    const toastId = toast.info(t("firstTime.creatingRestore"), {
      autoClose: false,
      isLoading: true,
      closeOnClick: false,
      draggable: false,
    })

    try {
      await invoke({ channel: "create-sparkle-restore-point" })

      toast.update(toastId, {
        render: t("firstTime.restoreCreated"),
        type: "success",
        isLoading: false,
        autoClose: 3000,
      })
    } catch (err) {
      toast.update(toastId, {
        render: t("firstTime.failedCreateRestore"),
        type: "error",
        isLoading: false,
        autoClose: 3000,
      })
      console.error("Error creating restore point:", err)
    }
  }

  const handleSkipRestorePoint = () => {
    localStorage.setItem("firstTime", "false")
    setOpen(false)
  }

  return (
    <Modal open={open} onClose={undefined}>
      <div className="bg-sparkle-card border border-sparkle-border rounded-2xl p-4 shadow-2xl max-w-2xl w-full mx-4 flex flex-col items-center text-center">
        <h1 className="text-3xl font-bold text-sparkle-text mb-4">{t("firstTime.welcome")}</h1>

        <p className="text-sparkle-text-secondary mb-6">
          {t("firstTime.welcomeDesc")}
        </p>

        <p className="text-sparkle-text-secondary mb-4 text-sm">
          <span className="font-medium">
            {t("firstTime.yesExplanation")}
          </span>
        </p>

        <p className="text-sparkle-text-secondary mb-4 text-sm">
          {t("firstTime.downloadWarning")}
        </p>

        <p className="text-red-500 mb-8 text-sm">
          {t("firstTime.malwareWarning")}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <Button onClick={handleGetStarted}>{t("firstTime.yesRecommended")}</Button>
          <Button onClick={handleSkipRestorePoint} variant="danger">
            {t("firstTime.noNotRecommended")}
          </Button>
        </div>

        <p className="text-sparkle-text-secondary mt-4 text-sm">
          <span className="font-semibold">{t("firstTime.version")}</span>{" "}
          {data?.version || "Error fetching version"}
        </p>
      </div>
    </Modal>
  )
}
