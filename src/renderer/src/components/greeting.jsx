import { useMemo, useState, useEffect } from "react"
import { invoke } from "@/lib/electron"

/**
 * Renders a personalized greeting header that shows a random salutation and the user's name (or "friend").
 *
 * On mount, attempts to read the user name from localStorage under "sparkle:user"; if absent, requests it via the "get-user-name" IPC channel and caches it on success. The displayed salutation is chosen once on mount from a set of general greetings combined with a time-of-day greeting.
 * @returns {JSX.Element} An <h1> element containing the selected greeting and the user's name (or "friend" when no name is available).
 */
function Greeting() {
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

  const generalGreetings = [
    "Hi",
    "Hello",
    "Hey",
    "Greetings",
    "Yo",
    "Howdy",
    "What's up",
    "Good to see you",
    "Welcome Back",
    "Ahoy",
  ]

  const timeGreetings = () => {
    const hour = new Date().getHours()
    if (hour < 12) return ["Good morning"]
    if (hour < 18) return ["Good afternoon"]
    return ["Good evening"]
  }

  const randomGreeting = useMemo(() => {
    const allGreetings = [...generalGreetings, ...timeGreetings()]
    return allGreetings[Math.floor(Math.random() * allGreetings.length)]
  }, [])

  return (
    <h1 className="text-3xl font-bold mb-5">
      {randomGreeting},{" "}
      <span className="bg-linear-to-r from-sparkle-primary to-sparkle-secondary bg-clip-text text-transparent">
        {name || "friend"}
      </span>
    </h1>
  )
}

export default Greeting