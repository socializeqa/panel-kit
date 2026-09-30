"use client";

import { useState } from "react";
import { DateField } from "@socialize/panel-kit/date-field";
import { Drawer } from "@socialize/panel-kit/drawer";
import { DrawerTabs } from "@socialize/panel-kit/drawer-tabs";
import { Button, Field, Input } from "@socialize/panel-kit/fields";
import { ConfirmDialog } from "@socialize/panel-kit/modal";
import { PhoneInput } from "@socialize/panel-kit/phone-field";
import { Panel } from "@socialize/panel-kit/record";
import { Segmented } from "@socialize/panel-kit/segmented";
import { SelectMenu } from "@socialize/panel-kit/select-menu";
import { StarRating } from "@socialize/panel-kit/star-rating";
import { Switch } from "@socialize/panel-kit/switch";
import { TimeField } from "@socialize/panel-kit/time-field";
import { useToast } from "@socialize/panel-kit/toast";

// The browser half of the fixture: fields, a toast, a confirm gate and a
// controlled drawer with its rooms, each from the kit and nothing hand-built.
export function Demo() {
  const toast = useToast();
  const [drawer, setDrawer] = useState(false);
  const [gate, setGate] = useState(false);
  const [on, setOn] = useState(true);
  const [view, setView] = useState<"list" | "board">("list");
  const [stars, setStars] = useState(4);
  return (
    <Panel title="Fields">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name">
          <Input name="name" placeholder="Guest's name" />
        </Field>
        <Field label="Day">
          <DateField name="day" />
        </Field>
        <Field label="Time">
          <TimeField name="time" hours={{ from: 12, to: 2 }} />
        </Field>
        <Field label="Phone">
          <PhoneInput name="phone" />
        </Field>
        <Field label="Branch">
          <SelectMenu
            name="branch"
            options={[
              { value: "sadd", label: "Al Sadd" },
              { value: "westbay", label: "West Bay" },
            ]}
          />
        </Field>
        <div className="flex flex-wrap items-center gap-4">
          <Switch checked={on} onChange={setOn} label="Online booking" />
          <Segmented value={view} onChange={setView} options={[{ value: "list", label: "List" }, { value: "board", label: "Board" }]} />
          <StarRating value={stars} onChange={setStars} size={20} />
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <Button type="button" onClick={() => toast("Booking saved")}>
          Show a toast
        </Button>
        <Button type="button" variant="ghost" onClick={() => setDrawer(true)}>
          Open a drawer
        </Button>
        <Button type="button" variant="danger" onClick={() => setGate(true)}>
          Delete
        </Button>
      </div>
      <Drawer open={drawer} onOpenChange={setDrawer} title="Booking">
        <DrawerTabs
          title="Booking"
          sub="Tonight, 8:30 PM"
          tabs={[
            { key: "guest", label: "Guest", icon: null, content: <p className="text-[13px]">A controlled drawer from the kit.</p> },
            { key: "notes", label: "Notes", icon: null, count: 2, content: <p className="text-[13px]">Two notes.</p> },
          ]}
        />
      </Drawer>
      <ConfirmDialog
        open={gate}
        onClose={() => setGate(false)}
        onConfirm={() => setGate(false)}
        title="Delete this booking?"
        body="The guest is not told."
        consequences={[{ tone: "warn", text: "The table is freed for the night." }]}
      />
    </Panel>
  );
}
