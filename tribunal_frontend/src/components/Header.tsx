import { useNavigate, NavLink } from "react-router-dom";
import { useState, useEffect, useRef } from 'react';
import { useQuery } from "@apollo/client";
import { gql } from "@apollo/client";
import {
  Search, User, LogOut, ChevronDown, FolderOpen, Users, Calendar,
  Scale, FileText, X, Loader2,
} from 'lucide-react';
import { useAuth } from "../context/AuthContext";
import NotificacionesPanel from "./NotificacionesPanel";

const GLOBAL_SEARCH = gql`
  query GlobalSearch {
    allExpedientes {
      idExpediente
      numeroExpediente
      idTipoProceso { nombre }
      idEstadoExpediente { nombreEstado esTerminal }
    }
    allPersonas {
      idPersona
      nombre
      primerApellido
      segundoApellido
      numeroDocumento
      esAbogado
    }
    allAudiencias {
      idAudiencia
      estadoAudiencia
      fechaHoraProgramada
      idExpediente { numeroExpediente }
      idTipoAudiencia { nombre }
    }
    allResoluciones {
      idResolucion
      numeroResolucion
      estado
      idExpediente { numeroExpediente }
    }
  }
`;

type ResultKind = "expediente" | "persona" | "audiencia" | "resolucion";

interface SearchResult {
  kind: ResultKind;
  id: number;
  title: string;
  sub: string;
  badge?: string;
  path: string;
  detailId?: number;
}

const fmtFechaHora = (iso: string) =>
  new Date(iso).toLocaleString("es-BO", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });

const BADGE_COLORS: Record<ResultKind, string> = {
  expediente: "bg-blue-100 text-blue-700",
  persona:    "bg-purple-100 text-purple-700",
  audiencia:  "bg-indigo-100 text-indigo-700",
  resolucion: "bg-amber-100 text-amber-700",
};

const KIND_ICONS: Record<ResultKind, React.ElementType> = {
  expediente: FolderOpen,
  persona:    Users,
  audiencia:  Calendar,
  resolucion: Scale,
};

const KIND_LABELS: Record<ResultKind, string> = {
  expediente: "Expediente",
  persona:    "Persona",
  audiencia:  "Audiencia",
  resolucion: "Resolución",
};

function GlobalSearchBox({ onNavigateToExpediente }: { onNavigateToExpediente: (id: number) => void }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const { data, loading } = useQuery(GLOBAL_SEARCH, { fetchPolicy: "cache-and-network" });

  const buildResults = (q: string): SearchResult[] => {
    if (!data || q.trim().length < 2) return [];
    const term = q.toLowerCase();
    const out: SearchResult[] = [];
    (data.allExpedientes ?? []).forEach((e: any) => {
      if (e.numeroExpediente?.toLowerCase().includes(term) || e.idTipoProceso?.nombre?.toLowerCase().includes(term)) {
        out.push({ kind: "expediente", id: e.idExpediente, title: `Expediente ${e.numeroExpediente}`, sub: e.idTipoProceso?.nombre ?? "—", badge: e.idEstadoExpediente?.nombreEstado, path: "/expedientes", detailId: e.idExpediente });
      }
    });
    (data.allPersonas ?? []).forEach((p: any) => {
      const fullName = `${p.nombre} ${p.primerApellido} ${p.segundoApellido ?? ""}`;
      if (fullName.toLowerCase().includes(term) || p.numeroDocumento?.toLowerCase().includes(term)) {
        out.push({ kind: "persona", id: p.idPersona, title: fullName.trim(), sub: p.numeroDocumento ?? "Sin documento", badge: p.esAbogado ? "Abogado" : undefined, path: "/personas" });
      }
    });
    (data.allAudiencias ?? []).forEach((a: any) => {
      if (a.idTipoAudiencia?.nombre?.toLowerCase().includes(term) || a.idExpediente?.numeroExpediente?.toLowerCase().includes(term)) {
        out.push({ kind: "audiencia", id: a.idAudiencia, title: a.idTipoAudiencia?.nombre ?? "Audiencia", sub: `Exp. ${a.idExpediente?.numeroExpediente ?? "—"} · ${fmtFechaHora(a.fechaHoraProgramada)}`, badge: a.estadoAudiencia, path: "/audiencias" });
      }
    });
    (data.allResoluciones ?? []).forEach((r: any) => {
      if (r.numeroResolucion?.toLowerCase().includes(term) || r.idExpediente?.numeroExpediente?.toLowerCase().includes(term)) {
        out.push({ kind: "resolucion", id: r.idResolucion, title: r.numeroResolucion, sub: `Exp. ${r.idExpediente?.numeroExpediente ?? "—"}`, badge: r.estado, path: "/resoluciones" });
      }
    });
    return out.slice(0, 8);
  };

  const results = buildResults(query);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") { e.preventDefault(); inputRef.current?.focus(); setOpen(true); }
      if (e.key === "Escape") { setOpen(false); setQuery(""); inputRef.current?.blur(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (result: SearchResult) => {
    setQuery(""); setOpen(false);
    if (result.kind === "expediente" && result.detailId) { navigate(result.path); onNavigateToExpediente(result.detailId); }
    else navigate(result.path);
  };

  const grouped: Partial<Record<ResultKind, SearchResult[]>> = {};
  results.forEach(r => { if (!grouped[r.kind]) grouped[r.kind] = []; grouped[r.kind]!.push(r); });

  return (
    <div ref={boxRef} className="relative hidden md:block">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Buscar… (Ctrl+K)"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          className="w-72 pl-9 pr-8 py-2 text-sm rounded-xl border outline-none focus:ring-2 focus:ring-gray-200 focus:border-transparent bg-gray-100 border-gray-200 text-gray-900 placeholder-gray-400"
        />
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
          {loading && query.length >= 2 ? <Loader2 className="w-3.5 h-3.5 text-gray-400 animate-spin" />
            : query ? <button onClick={() => { setQuery(""); setOpen(false); }}><X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" /></button>
            : null}
        </div>
      </div>
      {open && query.trim().length >= 2 && (
        <div className="absolute top-full left-0 mt-2 w-[420px] rounded-2xl border shadow-2xl z-50 overflow-hidden bg-white border-gray-200">
          {results.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-sm text-gray-400">
              <FileText className="w-8 h-8 opacity-40" />
              <p>Sin resultados para <span className="font-semibold">"{query}"</span></p>
            </div>
          ) : (
            <div className="py-2 max-h-[420px] overflow-y-auto">
              {(Object.keys(grouped) as ResultKind[]).map(kind => (
                <div key={kind}>
                  <div className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">{KIND_LABELS[kind]}s</div>
                  {grouped[kind]!.map(result => {
                    const Icon = KIND_ICONS[result.kind];
                    return (
                      <button key={`${result.kind}-${result.id}`} onClick={() => handleSelect(result)} className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${BADGE_COLORS[result.kind]}`}><Icon className="w-4 h-4" /></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate text-gray-800">{result.title}</p>
                          <p className="text-xs truncate text-gray-500">{result.sub}</p>
                        </div>
                        {result.badge && <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold ${BADGE_COLORS[result.kind]}`}>{result.badge}</span>}
                      </button>
                    );
                  })}
                </div>
              ))}
              <div className="px-4 py-2 border-t text-[10px] border-gray-100 text-gray-400">{results.length} resultado{results.length !== 1 ? "s" : ""} · Esc para cerrar</div>
            </div>
          )}
        </div>
      )}
      {open && query.trim().length >= 2 && results.length > 0 && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}
    </div>
  );
}

export default function Header() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const nombre = usuario ? `${usuario.nombre} ${usuario.paterno}`.trim() || usuario.email?.split("@")[0] : "Usuario";
  const rol = usuario?.rol ?? "Administrador";
  const iniciales = nombre.charAt(0).toUpperCase();
  const userEmail = usuario?.email ?? "usuario@tribunal.com";

  const handleLogout = () => { logout(); navigate("/"); };

  useEffect(() => {
    const close = () => setShowUserMenu(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const handleNavigateToExpediente = (id: number) => {
    navigate("/expedientes");
    sessionStorage.setItem("openExpedienteDetalle", String(id));
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <h2 className="text-sm font-semibold text-gray-400">Panel de Control</h2>
      </div>
      <div className="flex items-center gap-3">
        <GlobalSearchBox onNavigateToExpediente={handleNavigateToExpediente} />
        <NotificacionesPanel />
        <div className="w-px h-8 bg-gray-200" />
        <div className="relative">
          <button
            onClick={e => { e.stopPropagation(); setShowUserMenu(!showUserMenu); }}
            className="flex items-center gap-3 pl-2 py-1 pr-3 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <div className="w-8 h-8 bg-gray-900 text-white font-bold flex items-center justify-center rounded-lg text-sm">
              {iniciales}
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-sm font-semibold text-gray-900">{nombre}</p>
              <p className="text-xs text-gray-500">{rol}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </button>
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-xl py-1 z-50" onClick={e => e.stopPropagation()}>
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">{nombre}</p>
                <p className="text-xs text-gray-500">{userEmail}</p>
              </div>
              <NavLink to="/perfil" onClick={() => setShowUserMenu(false)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                <User className="w-4 h-4" /> Mi Perfil
              </NavLink>
              <div className="border-t border-gray-100 my-1" />
              <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 flex items-center gap-3">
                <LogOut className="w-4 h-4" /> Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}