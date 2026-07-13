import { useMemo, useState, useEffect } from "react"
import { invoke } from "@/lib/electron"
import { useTranslation } from "react-i18next"

function Greeting() {
  const { t } = useTranslation()
  const [name, setName] = useState("")

  useEffect(() => {
    const cached = localStorage.getItem("sparkle:user")
    if (cached) {
      setName(cached)
    } else {
      invoke({ channel: "get-user-name" })
        .then((username) => {
          if (username) {
            setName(username)
            localStorage.setItem("sparkle:user", username)
          }
        })
        .catch((err) => {
          console.error("Error fetching user name:", err)
        })
    }
  }, [])

  const generalGreetings: string[] = t("greeting.greetings", { returnObjects: true })

  const timeGreetings = () => {
    const hour = new Date().getHours()
    if (hour < 12) return [t("greeting.morning")]
    if (hour < 18) return [t("greeting.afternoon")]
    return [t("greeting.evening")]
  }

  const randomGreeting = useMemo(() => {
    const allGreetings = [...generalGreetings, ...timeGreetings()]
    return allGreetings[Math.floor(Math.random() * allGreetings.length)]
  }, [])

  return (
    <h1 className="text-2xl font-bold mb-4">
      {randomGreeting},{" "}
      <span className="bg-linear-to-r from-sparkle-primary to-sparkle-secondary bg-clip-text text-transparent">
        {name || t("greeting.friend")}
      </span>
    </h1>
  )
}

export default Greeting
