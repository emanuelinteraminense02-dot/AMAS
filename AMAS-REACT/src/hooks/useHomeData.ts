import { useCallback, useEffect, useState } from 'react';
import { apiAdmin, apiEventos, apiNoticias, apiProjetos } from '@/services/api';
import type { Estatisticas, Evento, Noticia, Projeto } from '@/types';

interface HomeData {
  estatisticas: Estatisticas;
  noticias: Noticia[];
  eventos: Evento[];
  projetos: Projeto[];
  loading: boolean;
  refreshing: boolean;
  erroEstatisticas: boolean;
  erroNoticias: boolean;
  erroEventos: boolean;
  refresh: () => Promise<void>;
}

const ESTATISTICAS_VAZIAS: Estatisticas = { total: 0, regulares: 0 };

export function useHomeData(): HomeData {
  const [estatisticas, setEstatisticas] = useState<Estatisticas>(ESTATISTICAS_VAZIAS);
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [erroEstatisticas, setErroEstatisticas] = useState(false);
  const [erroNoticias, setErroNoticias] = useState(false);
  const [erroEventos, setErroEventos] = useState(false);

  const load = useCallback(async (isRefresh: boolean) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    const [statsRes, noticiasRes, eventosRes, projetosRes] = await Promise.allSettled([
      apiAdmin.getDashboard() as Promise<Estatisticas>,
      apiNoticias.listar() as Promise<Noticia[]>,
      apiEventos.listar() as Promise<Evento[]>,
      apiProjetos.listarEmAndamento() as Promise<Projeto[]>,
    ]);

    if (statsRes.status === 'fulfilled') {
      setEstatisticas(statsRes.value ?? ESTATISTICAS_VAZIAS);
      setErroEstatisticas(false);
    } else {
      setErroEstatisticas(true);
    }

    if (noticiasRes.status === 'fulfilled') {
      setNoticias(noticiasRes.value ?? []);
      setErroNoticias(false);
    } else {
      setErroNoticias(true);
    }

    if (eventosRes.status === 'fulfilled') {
      setEventos(eventosRes.value ?? []);
      setErroEventos(false);
    } else {
      setErroEventos(true);
    }

    if (projetosRes.status === 'fulfilled') {
      setProjetos(projetosRes.value ?? []);
    }

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    load(false);
  }, [load]);

  const refresh = useCallback(() => load(true), [load]);

  return {
    estatisticas,
    noticias,
    eventos,
    projetos,
    loading,
    refreshing,
    erroEstatisticas,
    erroNoticias,
    erroEventos,
    refresh,
  };
}
