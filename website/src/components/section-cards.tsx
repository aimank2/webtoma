import {
  CalendarClock,
  FileSpreadsheet,
  FolderCog,
  Lightbulb,
  MailCheck,
  MapIcon,
  Sparkles,
  Wrench,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function SectionCards() {
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {/* Google Sheets Automation */}
      <Card className="@container/card bg-green-50 dark:bg-green-900/10">
        <CardHeader>
          <CardDescription className="flex items-center gap-2">
            <FileSpreadsheet className="text-green-600 dark:text-green-400 size-4" />
            Sheets AI
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            Smart Sheet AI
          </CardTitle>
          <CardAction>
            <Badge
              variant="outline"
              className="text-green-700 dark:text-green-300 border-green-400"
            >
              <Sparkles className="size-3.5 mr-1" />
              +AI Boosted
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="flex gap-2 font-medium">
            Automated edits & updates
            <Sparkles className="size-4 text-green-500" />
          </div>
          <div className="text-muted-foreground">
            Managed via AI + Google APIs
          </div>
        </CardFooter>
      </Card>

      {/* Coming Soon – AI Drive Organizer */}
      <Card className="@container/card bg-blue-50">
        <CardHeader>
          <CardDescription className="flex items-center gap-2">
            <FolderCog className="text-blue-600 size-4" />
            AI Drive Organizer
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            Coming Soon
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="text-blue-700 border-blue-400">
              <MapIcon className="size-3.5 mr-1 " />
              Soon
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="flex gap-2 font-medium">
            Auto-tagging & sorting
            <FolderCog className="size-4 text-blue-500" />
          </div>
          <div className="text-muted-foreground">
            Smart file grouping powered by AI
          </div>
        </CardFooter>
      </Card>

      {/* Placeholder – AI Inbox Sorter */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="flex items-center gap-2">
            <MailCheck className="text-yellow-600 size-4" />
            AI Inbox Sorter
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            Coming Soon
          </CardTitle>
          <CardAction>
            <Badge
              variant="outline"
              className="text-yellow-700 border-yellow-400"
            >
              <Wrench className="size-3.5 mr-1" />
              Planning
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="flex gap-2 font-medium">
            Filters and labels by intent
            <MailCheck className="size-4 text-yellow-500" />
          </div>
          <div className="text-muted-foreground">
            AI-powered email workflows
          </div>
        </CardFooter>
      </Card>

      {/* Placeholder – Calendar Assistant */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="flex items-center gap-2">
            <CalendarClock className="text-purple-600 size-4" />
            AI Calendar Assistant
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            Coming Soon
          </CardTitle>
          <CardAction>
            <Badge
              variant="outline"
              className="text-purple-700 border-purple-400"
            >
              <Lightbulb className="size-3.5 mr-1" />
              Under Design
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="flex gap-2 font-medium">
            Predictive scheduling
            <CalendarClock className="size-4 text-purple-500" />
          </div>
          <div className="text-muted-foreground">
            AI suggestions & meeting prep
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
