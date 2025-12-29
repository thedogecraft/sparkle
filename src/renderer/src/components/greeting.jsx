import { useMemo, useState, useEffect } from "react"
import { invoke } from "@/lib/electron"

/**
 * Render a heading greeting the user with a randomly chosen salutation and the stored or fetched user name.
 *
 * Reads the user name from localStorage key "sparkle:user"; if absent, requests it via the "get-user-name" IPC channel
 * and stores a successful result in localStorage. Selects a greeting that includes general salutations and a time-of-day
 * greeting, and displays "friend" when no name is available.
 *
 * @returns {JSX.Element} A heading element containing the greeting and the user's name (or "friend" when not available).
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