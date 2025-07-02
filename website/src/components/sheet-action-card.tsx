import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Brain,
  PlusCircle,
  ArrowDownCircle,
  Edit,
  Eraser,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type SheetActionsProps = {
  handleCreate: () => void;
  handleAppend: () => void;
  handleUpdate: () => void;
  handleClear: () => void;
  loadingCreate?: boolean;
  loadingAppend?: boolean;
  loadingUpdate?: boolean;
  loadingClear?: boolean;
};

const SheetActions = ({
  handleCreate,
  handleAppend,
  handleUpdate,
  handleClear,
  loadingCreate = false,
  loadingAppend = false,
  loadingUpdate = false,
  loadingClear = false,
}: SheetActionsProps) => {
  return (
    <Card className="@container/card">
      <CardHeader>
        <CardDescription className="flex items-center gap-2">
          <Brain className=" text-xs" />
          Sheets AI Automation Google
        </CardDescription>
        <CardAction>
          <Button variant="link" size="sm" className=" text-xs rounded-full">
            <Sparkles className="mr-1.5  " />
            Upgrade
          </Button>
        </CardAction>
        <CardTitle className="text-2xl font-bold tabular-nums @[250px]/card:text-3xl">
          Smart Sheets
        </CardTitle>
      </CardHeader>

      <CardFooter className="flex-row items-start gap-1.5 text-sm">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCreate}
          disabled={loadingCreate}
          className=" text-xs rounded-full"
        >
          <PlusCircle className="mr-1.5  " />
          Create
        </Button>

        <Button
          className=" text-xs rounded-full"
          variant="outline"
          size="sm"
          onClick={handleAppend}
          disabled={loadingAppend}
        >
          <ArrowDownCircle className="mr-1.5  " />
          Append
        </Button>

        <Button
          className=" text-xs rounded-full"
          variant="outline"
          size="sm"
          onClick={handleUpdate}
          disabled={loadingUpdate}
        >
          <Edit className="mr-1.5  " />
          Update
        </Button>

        <Button
          className=" text-xs rounded-full"
          variant="outline"
          size="sm"
          onClick={handleClear}
          disabled={loadingClear}
        >
          <Eraser className="mr-1.5  " />
          Clear
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SheetActions;
