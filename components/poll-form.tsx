"use client"

import type React from "react"
import { useState } from "react"
import { useSelector } from "react-redux"
import type { RootState } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Plus, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type PollType = "single-choice" | "multi-select"

export default function PollForm() {
  const { toast } = useToast()
  const auth = useSelector((s: RootState) => s.auth)
  const token = auth?.token

  const [question, setQuestion] = useState("")
  const [type, setType] = useState<PollType>("single-choice")
  const [options, setOptions] = useState<string[]>(["", ""])
  const [start, setStart] = useState<string>("")
  const [end, setEnd] = useState<string>("")
  const [categoriesInput, setCategoriesInput] = useState<string>("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function updateOption(idx: number, value: string) {
    setOptions((prev) => prev.map((o, i) => (i === idx ? value : o)))
  }
  function addOption() {
    setOptions((prev) => [...prev, ""])
  }
  function removeOption(idx: number) {
    setOptions((prev) => prev.filter((_, i) => i !== idx))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const cleanedOptions = options.map((o) => o.trim()).filter(Boolean)
    if (!question.trim() || cleanedOptions.length < 2 || !start || !end) {
      setError("Please provide a question, at least 2 options, a start date, and an end date.")
      return
    }
    const startISO = new Date(start).toISOString()
    const endISO = new Date(end).toISOString()
    if (new Date(endISO) <= new Date(startISO)) {
      setError("End date must be after start date.")
      return
    }
    const categories = categoriesInput
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean)

    setSubmitting(true)
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" }
      if (token) headers.Authorization = `Bearer ${token}`

      const res = await fetch("/api/polls", {
        method: "POST",
        headers,
        body: JSON.stringify({
          question: question.trim(),
          options: cleanedOptions,
          startDate: startISO,
          endDate: endISO,
          type,
          categories,
        }),
      })
      const data = await res.json().catch(() => ({}) as any)
      if (!res.ok) {
        setError(data.error || `Failed to create poll (HTTP ${res.status})`)
        return
      }
      toast({ title: "Poll created", description: "Your poll has been added." })
      // Reset form
      setQuestion("")
      setType("single-choice")
      setOptions(["", ""])
      setStart("")
      setEnd("")
      setCategoriesInput("")
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Create Poll</CardTitle>
        <CardDescription>In this demo, anyone can create a poll.</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="question">Question</Label>
            <Input
              id="question"
              placeholder="What should we ask?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select value={type} onValueChange={(v: PollType) => setType(v)}>
                <SelectTrigger id="type" aria-label="Poll type">
                  <SelectValue placeholder="Select poll type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single-choice">Single choice</SelectItem>
                  <SelectItem value="multi-select">Multi-select</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="categories">Categories (comma-separated)</Label>
              <Input
                id="categories"
                placeholder="Programming, Web"
                value={categoriesInput}
                onChange={(e) => setCategoriesInput(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start">Start</Label>
              <Input
                id="start"
                type="datetime-local"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end">End</Label>
              <Input id="end" type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} required />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Options</Label>
            <div className="space-y-2">
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    aria-label={`Option ${i + 1}`}
                    placeholder={`Option ${i + 1}`}
                    value={opt}
                    onChange={(e) => updateOption(i, e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeOption(i)}
                    disabled={options.length <= 2}
                    aria-label={`Remove option ${i + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={addOption}
              className="mt-2 bg-transparent"
              aria-label="Add option"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add option
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTitle>Could not create poll</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <CardFooter className="px-0">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Creating..." : "Create poll"}
            </Button>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  )
}
