"use client";

import { useState } from "react";
import { RECYCLE_EMPTY_ICON, appsFor } from "@/data/apps";
import { BIN_ITEMS, type BinItem } from "@/data/recycleBin";
import { formatDateTime } from "@/lib/i18n";
import { useLang, useStrings } from "@/lib/language";
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
  const lang = useLang();
  const t = useStrings();
  const apps = appsFor(lang);
  const items = api.binEmpty ? [] : BIN_ITEMS;
  const icon = (item: BinItem) => (item.kind === "folder" ? FOLDER_ICON : FILE_ICON);

  const openItem = (item: BinItem) => {
    setSelected(item.name);
    setDialog({ type: "item", item });
  };
  const close = () => setDialog(null);

  return (
    <div className="relative flex h-full flex-col text-[11px]">
      <MenuBar items={t.menus.explorer} />
      <Toolbar>
        <ToolButton
          icon={
            // eslint-disable-next-line @next/next/no-img-element
            <img src={RECYCLE_EMPTY_ICON} alt="" width={22} height={22} />
          }
          label={t.bin.empty}
          disabled={!items.length}
          onClick={() => setDialog({ type: "confirmEmpty" })}
        />
        <ToolButton
          icon={
            // eslint-disable-next-line @next/next/no-img-element
            <img src={FOLDER_ICON} alt="" width={22} height={22} />
          }
          label={t.bin.restoreAll}
          disabled={!items.length}
          onClick={() => setDialog({ type: "restoreAll" })}
        />
      </Toolbar>
      <AddressBar>
        <div className="flex min-w-0 flex-1 items-center gap-1 border border-[var(--xp-input-border)] bg-white px-1 py-[3px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={items.length ? apps.recycle.icon : RECYCLE_EMPTY_ICON} alt="" width={16} height={16} />
          {apps.recycle.label}
        </div>
      </AddressBar>

      <div className="flex min-h-0 flex-1">
        <TaskPane>
          <TaskPanel title={t.bin.tasks}>
            {items.length ? (
              <>
                <TaskLink icon={RECYCLE_EMPTY_ICON} onClick={() => setDialog({ type: "confirmEmpty" })}>
                  {t.bin.emptyTask}
                </TaskLink>
                <TaskLink icon={FOLDER_ICON} onClick={() => setDialog({ type: "restoreAll" })}>
                  {t.bin.restoreAll}
                </TaskLink>
              </>
            ) : (
              <p className="text-[#555]">{t.bin.nothing}</p>
            )}
          </TaskPanel>
          <TaskPanel title={t.otherPlaces}>
            <TaskLink icon={apps.projects.icon} onClick={() => api.openApp("projects")}>
              {apps.projects.label}
            </TaskLink>
            <TaskLink icon={apps.cv.icon} onClick={() => api.openApp("cv")}>
              {apps.cv.label}
            </TaskLink>
          </TaskPanel>
          <TaskPanel title={t.details}>
            <p className="font-bold">{apps.recycle.label}</p>
            <p>{t.bin.systemFolder}</p>
          </TaskPanel>
        </TaskPane>

        <div className="min-w-0 flex-1 overflow-auto bg-white" onClick={(e) => e.target === e.currentTarget && setSelected(null)}>
          <table className="w-full border-collapse text-left">
            <thead className="sticky top-0 bg-[var(--xp-face)]">
              <tr>
                {t.bin.columns.map((h, i) => (
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
                    <td className="hidden whitespace-nowrap px-2 py-0.5 @xl:table-cell">{formatDateTime(item.deleted, lang)}</td>
                    <td className="whitespace-nowrap px-2 py-0.5 text-right pointer-coarse:py-2.5">{item.size}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <StatusBar>
        <span className="flex-1">{t.objects(items.length)}</span>
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
                    label: lang === "da" ? (dialog.item.da.action ?? dialog.item.action.label) : dialog.item.action.label,
                    onClick: () => {
                      close();
                      api.openApp("projects", { project: dialog.item.action!.project });
                    },
                  },
                ]
              : []),
            { label: t.ok, onClick: close },
          ]}
        >
          {lang === "da" ? dialog.item.da.note : dialog.item.note}
        </MessageBox>
      )}
      {dialog?.type === "confirmEmpty" && (
        <MessageBox
          title={t.bin.confirmTitle}
          icon="question"
          onClose={close}
          buttons={[
            {
              label: t.yes,
              onClick: () => {
                close();
                setSelected(null);
                api.emptyBin();
              },
            },
            { label: t.no, onClick: close },
          ]}
        >
          {t.bin.confirm(items.length)}
        </MessageBox>
      )}
      {dialog?.type === "restoreAll" && (
        <MessageBox title={t.bin.restoreTitle} icon="warning" onClose={close} buttons={[{ label: t.ok, onClick: close }]}>
          {t.bin.restoreText}
        </MessageBox>
      )}
    </div>
  );
}
