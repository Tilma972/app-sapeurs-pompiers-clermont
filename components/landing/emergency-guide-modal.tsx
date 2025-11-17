"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { EMERGENCY_GUIDES, GUIDE_KEYS, GuideKey } from "@/lib/emergency-guides"
import { Flame, Heart, Globe } from "lucide-react"

interface EmergencyGuideModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial?: GuideKey
}

export default function EmergencyGuideModal({ open, onOpenChange, initial = "18" }: EmergencyGuideModalProps) {
  const [value, setValue] = React.useState<GuideKey>(initial)

  React.useEffect(() => {
    setValue(initial)
  }, [initial])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="mx-0 w-full h-[min(100vh,100dvh)] sm:mx-4 sm:w-[min(100vw-2rem,40rem)] sm:max-h-[85vh] rounded-t-lg sm:rounded-lg p-4 sm:p-6 bg-card text-foreground border border-border overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-lg font-semibold tracking-tight flex items-center gap-3">
                {/* Use lucide icons instead of emoji to avoid platform rendering issues */}
                {value === "18" ? <Flame className="h-6 w-6 text-primary" /> : null}
                {value === "15" ? <Heart className="h-6 w-6 text-primary" /> : null}
                {value === "112" ? <Globe className="h-6 w-6 text-primary" /> : null}
                <span>{EMERGENCY_GUIDES[value].title}</span>
              </DialogTitle>
            </div>
            {/* DialogContent already provides a close button; avoid duplicating it here */}
          </div>
          {EMERGENCY_GUIDES[value].intro ? (
            <p className="text-sm text-muted-foreground mt-1">{EMERGENCY_GUIDES[value].intro}</p>
          ) : null}
        </DialogHeader>

        <div className="mt-4">
          <Tabs value={value} onValueChange={(v) => setValue(v as GuideKey)}>
            <TabsList>
              {GUIDE_KEYS.map((k) => (
                <TabsTrigger key={k} value={k} className="flex-1 text-center">
                  {k}
                </TabsTrigger>
              ))}
            </TabsList>

            {GUIDE_KEYS.map((k) => (
              <TabsContent key={k} value={k} className="mt-2 text-sm">
                {EMERGENCY_GUIDES[k].sections.map((sec, idx) => (
                  <section key={idx} className="mb-4">
                    {sec.title ? <h3 className="font-semibold mb-1">{sec.title}</h3> : null}
                    {sec.paragraphs?.map((p, i) => (
                      <p key={i} className="mb-1 text-sm text-muted-foreground">{p}</p>
                    ))}
                    {sec.list ? (
                      <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                        {sec.list.map((li, j) => (
                          <li key={j}>{li}</li>
                        ))}
                      </ul>
                    ) : null}
                  </section>
                ))}

                {EMERGENCY_GUIDES[k].footer ? (
                  <p className="text-xs text-muted-foreground mt-3">{EMERGENCY_GUIDES[k].footer}</p>
                ) : null}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}
