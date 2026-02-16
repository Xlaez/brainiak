import { getTierColor, getTierName } from "@/lib/profile.utils";
import { useAuthStore } from "@/stores/authStore";
import { ChevronDown } from "lucide-react";
import * as Select from "@radix-ui/react-select";

interface TierSelectorProps {
  selected: number | null;
  onSelect: (tier: number) => void;
}

export function TierSelector({ selected, onSelect }: TierSelectorProps) {
  const { profile } = useAuthStore();
  const userTier = profile?.tier || 10;

  // Tiers go from 1 to 10.
  const allTiers = Array.from({ length: 10 }, (_, i) => i + 1);

  return (
    <div className="space-y-4">
      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
        Opponent Tier
      </label>

      <Select.Root
        value={selected?.toString()}
        onValueChange={(val) => onSelect(parseInt(val))}
      >
        <Select.Trigger
          className="w-full h-14 px-4 rounded-xl bg-slate-100 dark:bg-slate-900 border-none flex items-center justify-between text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none group"
          aria-label="Tier"
        >
          <Select.Value placeholder="Select target tier">
            {selected ? (
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] text-white bg-gradient-to-r ${getTierColor(selected)}`}
                >
                  T{selected}
                </span>
                <span>{getTierName(selected)}</span>
              </div>
            ) : (
              "Select target tier"
            )}
          </Select.Value>
          <Select.Icon>
            <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
          </Select.Icon>
        </Select.Trigger>

        <Select.Portal>
          <Select.Content className="overflow-hidden bg-white dark:bg-slate-800 rounded-xl shadow-2xl ring-1 ring-slate-200 dark:ring-slate-700 z-[100]">
            <Select.Viewport className="p-2">
              {allTiers.map((tier) => {
                const locked = tier > userTier;

                return (
                  <Select.Item
                    key={tier}
                    value={tier.toString()}
                    disabled={locked}
                    className={`
                      relative flex items-center h-10 px-8 rounded-lg text-sm font-bold select-none outline-none
                      ${
                        locked
                          ? "text-slate-400 cursor-not-allowed grayscale"
                          : "text-slate-700 dark:text-slate-300 data-[highlighted]:bg-blue-500 data-[highlighted]:text-white cursor-pointer"
                      }
                    `}
                  >
                    <Select.ItemText>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] text-white bg-gradient-to-r ${getTierColor(tier)}`}
                        >
                          T{tier}
                        </span>
                        <span>{getTierName(tier)}</span>
                        {locked && (
                          <span className="text-[10px] opacity-60 ml-1">
                            (Locked)
                          </span>
                        )}
                      </div>
                    </Select.ItemText>
                  </Select.Item>
                );
              })}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </div>
  );
}
