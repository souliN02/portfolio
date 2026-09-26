"use client";

import { useState } from "react";
import { APPS, RECYCLE_EMPTY_ICON } from "@/data/apps";
import { BIN_ITEMS, type BinItem } from "@/data/recycleBin";
import MessageBox from "@/components/ui/MessageBox";
import { useDesktop } from "@/components/desktop/DesktopContext";
import { AddressBar, MenuBar, StatusBar, TaskLink, TaskPane, TaskPanel, ToolButton, Toolbar } from "./ExplorerChrome";

type Dialog = { type: "item"; item: BinItem } | { type: "confirmEmpty" } | { type: "restoreAll" };

const FILE_ICON = "/xp-icons/File.ico";
const FOLDER_ICON = "/xp-icons/Folder Closed.ico";

export default function RecycleBin() {
  const api = useDesktop();
  const [selected, setSelected] = useState<string | null>(null);
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const items = api.binEmpty ? [] : BIN_ITEMS;
  const icon = (item: BinItem) => (item.kind === "folder" ? FOLDER_ICON : FILE_ICON);

  const openItem = (item: BinItem) => {
    setSelected(item.name);
    setDialog({ type: "item", item });
  };
  const close = () => setDialog(null);

  return (
    <div className="relative flex h-full flex-col text-[11px]">
      <MenuBar items={["File", "Edit", "View", "Favorites", "Tools", "Help"]} />
      <Toolbar>
        <ToolButton
          icon={
            // eslint-disable-next-line @next/next/no-img-element
            <img src={RECYCLE_EMPTY_ICON} alt="" width={22} height={22} />
          }
          label="Empty Recycle Bin"
          disabled={!items.length}
          onClick={() => setDialog({ type: "confirmEmpty" })}
        />
        <ToolButton
          icon={
            // eslint-disable-next-line @next/next/no-img-element
            <img src={FOLDER_ICON} alt="" width={22} height={22} />
          }
          label="Restore all items"
          disabled={!items.length}
          onClick={() => setDialog({ type: "restoreAll" })}
        />
      </Toolbar>
      <AddressBar>
        <div className="flex min-w-0 flex-1 items-center gap-1 border border-[var(--xp-input-border)] bg-white px-1 py-[3px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={items.length ? APPS.recycle.icon : RECYCLE_EMPTY_ICON} alt="" width={16} height={16} />
          Recycle Bin
        </div>
      </AddressBar>

      <div className="flex min-h-0 flex-1">
        <TaskPane>
          <TaskPanel title="Recycle Bin Tasks">
            {items.length ? (
              <>
                <TaskLink icon={RECYCLE_EMPTY_ICON} onClick={() => setDialog({ type: "confirmEmpty" })}>
                  Empty the Recycle Bin
                </TaskLink>
                <TaskLink icon={FOLDER_ICON} onClick={() => setDialog({ type: "restoreAll" })}>
                  Restore all items
                </TaskLink>
              </>
            ) : (
              <p className="text-[#555]">Nothing left to delete.</p>
            )}
          </TaskPanel>
          <TaskPanel title="Other Places">
            <TaskLink icon={APPS.projects.icon} onClick={() => api.openApp("projects")}>
              My Projects
            </TaskLink>
            <TaskLink icon={APPS.cv.icon} onClick={() => api.openApp("cv")}>
              Bekir&apos;s CV
            </TaskLink>
          </TaskPanel>
          <TaskPanel title="Details">
            <p className="font-bold">Recycle Bin</p>
            <p>System Folder</p>
          </TaskPanel>
        </TaskPane>

        <div className="min-w-0 flex-1 overflow-auto bg-white" onClick={(e) => e.target === e.currentTarget && setSelected(null)}>
          <table className="w-full border-collapse text-left">
            <thead className="sticky top-0 bg-[var(--xp-face)]">
              <tr>
                {["Name", "Original Location", "Date Deleted", "Size"].map((h, i) => (
                  <th
                    key={h}
                    scope="col"
                    className={`border-b border-r border-[#d6d2c2] px-2 py-0.5 font-normal ${i === 1 || i === 2 ? "hidden @xl:table-cell" : ""} ${i === 3 ? "text-right" : ""}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const isSel = selected === item.name;
                return (
                  <tr
                    key={item.name}
                    className={isSel ? "bg-[var(--xp-select)] text-white" : "hover:bg-[#eef3fd]"}
                    onClick={() => (api.touch ? openItem(item) : setSelected(item.name))}
                    onDoubleClick={() => openItem(item)}
                  >
                    <td className="w-[45%] max-w-0 px-2 py-0.5 pointer-coarse:py-2.5" title={item.name}>
                      <button
                        type="button"
                        className="flex w-full min-w-0 items-center gap-1.5 text-left outline-none focus-visible:outline-1 focus-visible:outline-dotted"
                        onFocus={() => setSelected(item.name)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            openItem(item);
                          }
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={icon(item)} alt="" width={16} height={16} className="shrink-0" />
                        <span className="truncate">{item.name}</span>
                      </button>
                    </td>
                    <td className="hidden max-w-0 truncate px-2 py-0.5 @xl:table-cell" title={item.from}>
                      {item.from}
                    </td>
                    <td className="hidden whitespace-nowrap px-2 py-0.5 @xl:table-cell">{item.deleted}</td>
                    <td className="whitespace-nowrap px-2 py-0.5 text-right pointer-coarse:py-2.5">{item.size}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <StatusBar>
        <span className="flex-1">{items.length} objects</span>
      </StatusBar>

      {dialog?.type === "item" && (
        <MessageBox
          title={dialog.item.name}
          icon="info"
          onClose={close}
          buttons={[
            ...(dialog.item.action
              ? [
                  {
                    label: dialog.item.action.label,
                    onClick: () => {
                      close();
                      api.openApp("projects", { project: dialog.item.action!.project });
                    },
                  },
                ]
              : []),
            { label: "OK", onClick: close },
          ]}
        >
          {dialog.item.note}
        </MessageBox>
      )}
      {dialog?.type === "confirmEmpty" && (
        <MessageBox
          title="Confirm Multiple File Delete"
          icon="question"
          onClose={close}
          buttons={[
            {
              label: "Yes",
              onClick: () => {
                close();
                setSelected(null);
                api.emptyBin();
              },
            },
            { label: "No", onClick: close },
          ]}
        >
          Are you sure you want to delete these {items.length} items?
        </MessageBox>
      )}
      {dialog?.type === "restoreAll" && (
        <MessageBox title="Restore" icon="warning" onClose={close} buttons={[{ label: "OK", onClick: close }]}>
          Some things are better left deleted.
        </MessageBox>
      )}
    </div>
  );
}
