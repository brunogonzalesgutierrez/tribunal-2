// src/pages/denuncias/PanelReglamento.tsx
import { useState } from "react";
import { Clock, Scale, ChevronDown, ChevronRight, BookOpen } from "lucide-react";
import { PLAZOS_PROCESALES, ARTICULOS_REGLAMENTO, type PlazoProcesal, type Articulo } from "../../graphql/ReglamentoData";

// ─── Tarjeta de plazo ─────────────────────────────────────
function TarjetaPlazo({ plazo }: { plazo: PlazoProcesal }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <button
      onClick={() => setAbierto(v => !v)}
      className="w-full text-left group"
    >
      <div className={`rounded-xl border transition-all ${
        abierto
          ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
          : "bg-gray-50 dark:bg-slate-800/60 border-gray-100 dark:border-slate-700 hover:border-amber-200 dark:hover:border-amber-800/50 hover:bg-amber-50/50 dark:hover:bg-amber-900/10"
      }`}>
        <div className="flex items-center gap-3 px-3 py-2.5">
          <div className={`shrink-0 min-w-[52px] text-center px-2 py-1 rounded-lg text-xs font-bold font-mono ${
            abierto
              ? "bg-amber-200 dark:bg-amber-800/60 text-amber-800 dark:text-amber-300"
              : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
          }`}>
            Art. {plazo.articulo}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{plazo.etapa}</p>
            <p className={`text-xs font-mono font-bold mt-0.5 ${
              abierto ? "text-amber-600 dark:text-amber-400" : "text-amber-500 dark:text-amber-500"
            }`}>{plazo.dias}</p>
          </div>
          <ChevronDown className={`w-3.5 h-3.5 shrink-0 text-gray-400 transition-transform ${abierto ? "rotate-180" : ""}`} />
        </div>
        {abierto && (
          <div className="px-3 pb-3">
            <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed border-t border-amber-200 dark:border-amber-800/50 pt-2.5">
              {plazo.descripcion}
            </p>
          </div>
        )}
      </div>
    </button>
  );
}

// ─── Tarjeta de artículo ──────────────────────────────────
function TarjetaArticulo({ art }: { art: Articulo }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <button
      onClick={() => setAbierto(v => !v)}
      className="w-full text-left group"
    >
      <div className={`rounded-xl border transition-all ${
        abierto
          ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
          : "bg-gray-50 dark:bg-slate-800/60 border-gray-100 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-800/50 hover:bg-blue-50/50 dark:hover:bg-blue-900/10"
      }`}>
        <div className="flex items-center gap-3 px-3 py-2.5">
          <div className={`shrink-0 min-w-[52px] text-center px-2 py-1 rounded-lg text-xs font-bold font-mono ${
            abierto
              ? "bg-blue-200 dark:bg-blue-800/60 text-blue-800 dark:text-blue-300"
              : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
          }`}>
            Art. {art.numero}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 text-left leading-tight">{art.titulo}</p>
          </div>
          <ChevronRight className={`w-3.5 h-3.5 shrink-0 text-gray-400 transition-transform ${abierto ? "rotate-90" : "group-hover:translate-x-0.5"}`} />
        </div>
        {abierto && (
          <div className="px-3 pb-3">
            <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed border-t border-blue-200 dark:border-blue-800/50 pt-2.5 whitespace-pre-line text-left">
              {art.texto}
            </p>
          </div>
        )}
      </div>
    </button>
  );
}

// ─── Panel principal ──────────────────────────────────────
export function PanelReglamento() {
  const [seccion, setSeccion] = useState<"plazos" | "referencias">("plazos");

  return (
    <div className="flex flex-col h-full">
      {/* Sub-tabs internos */}
      <div className="flex border-b border-gray-200 dark:border-slate-700 mb-4 shrink-0">
        <button
          onClick={() => setSeccion("plazos")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold transition-all relative ${
            seccion === "plazos"
              ? "text-amber-600 dark:text-amber-400"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          PLAZOS PROCESALES
          {seccion === "plazos" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-t" />
          )}
        </button>
        <button
          onClick={() => setSeccion("referencias")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold transition-all relative ${
            seccion === "referencias"
              ? "text-blue-600 dark:text-blue-400"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          REFERENCIAS LEGALES
          {seccion === "referencias" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-t" />
          )}
        </button>
      </div>

      {/* Contenido scrolleable */}
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
        {seccion === "plazos" && (
          <>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-2 px-1">
              Cliqueá cada plazo para ver el detalle del artículo correspondiente.
            </p>
            {PLAZOS_PROCESALES.map((p, i) => (
              <TarjetaPlazo key={i} plazo={p} />
            ))}
          </>
        )}
        {seccion === "referencias" && (
          <>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-2 px-1">
              Cliqueá un artículo para leer su texto completo del Reglamento ICU 048-2018.
            </p>
            {ARTICULOS_REGLAMENTO.map((a) => (
              <TarjetaArticulo key={a.numero} art={a} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
