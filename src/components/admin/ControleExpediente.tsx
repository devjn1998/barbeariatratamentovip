import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import api from "../../services/api";
import { Button, Switch, TimePicker } from "antd";
import { SaveOutlined } from "@ant-design/icons";
import moment from "moment";

export default function ControleExpediente() {
  const [estabelecimentoAberto, setEstabelecimentoAberto] = useState(
    localStorage.getItem("expedienteAberto") !== "false"
  );
  const [horarioAlmoco, setHorarioAlmoco] = useState(
    localStorage.getItem("horarioAlmoco") || ""
  );
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);

  useEffect(() => {
    carregarConfiguracoes();
    localStorage.setItem("expedienteAberto", estabelecimentoAberto.toString());
    localStorage.setItem("horarioAlmoco", horarioAlmoco);
  }, [estabelecimentoAberto, horarioAlmoco]);

  async function carregarConfiguracoes() {
    setCarregando(true);
    try {
      // Carregar status do expediente
      const resExpediente = await api.get("/api/configuracoes/expediente");
      setEstabelecimentoAberto(resExpediente.data.aberto);

      // Carregar horário de almoço
      const resAlmoco = await api.get("/api/configuracoes/horario-almoco");
      setHorarioAlmoco(resAlmoco.data.horario);
    } catch (error) {
      console.error("Erro ao carregar configurações:", error);
      toast.error("Não foi possível carregar as configurações");
    } finally {
      setCarregando(false);
    }
  }

  async function alternarExpediente() {
    setAtualizando(true);
    try {
      const novoStatus = !estabelecimentoAberto;
      await api.post("/api/configuracoes/expediente", { aberto: novoStatus });
      setEstabelecimentoAberto(novoStatus);
      toast.success(
        novoStatus
          ? "Expediente aberto com sucesso"
          : "Expediente encerrado com sucesso"
      );
    } catch (error) {
      console.error("Erro ao atualizar status do expediente:", error);
      toast.error("Não foi possível atualizar o status do expediente");
    } finally {
      setAtualizando(false);
    }
  }

  async function definirHorarioAlmoco(event: React.FormEvent) {
    event.preventDefault();
    setAtualizando(true);
    try {
      await api.post("/api/configuracoes/horario-almoco", {
        horario: horarioAlmoco,
      });
      toast.success(
        horarioAlmoco
          ? `Horário de almoço definido como ${horarioAlmoco}`
          : "Horário de almoço removido"
      );
    } catch (error) {
      console.error("Erro ao definir horário de almoço:", error);
      toast.error("Não foi possível definir o horário de almoço");
    } finally {
      setAtualizando(false);
    }
  }

  const toggleExpediente = () => {
    const novoEstado = !estabelecimentoAberto;
    setEstabelecimentoAberto(novoEstado);
    toast.success(
      `Expediente ${novoEstado ? "aberto" : "fechado"} com sucesso!`
    );
  };

  const salvarHorarioAlmoco = (horario: string) => {
    setHorarioAlmoco(horario);
    toast.success(`Horário de almoço definido para ${horario}`);
  };

  if (carregando) {
    return (
      <div className="p-4 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <h2 className="text-xl font-bold mb-4">Controle de Expediente</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Controle de Expediente */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium mb-3">Status do Estabelecimento</h3>
          <div className="flex items-center mb-4">
            <div
              className={`h-4 w-4 rounded-full mr-2 ${
                estabelecimentoAberto ? "bg-green-500" : "bg-red-500"
              }`}
            ></div>
            <span>{estabelecimentoAberto ? "Aberto" : "Fechado"}</span>
          </div>
          <Switch
            checked={estabelecimentoAberto}
            onChange={toggleExpediente}
            checkedChildren="Aberto"
            unCheckedChildren="Fechado"
          />
        </div>

        {/* Controle de Horário de Almoço */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium mb-3">Horário de Almoço</h3>
          <form onSubmit={definirHorarioAlmoco}>
            <div className="flex flex-col space-y-2 mb-4">
              <label className="text-sm text-gray-600">
                Selecione o horário (deixe vazio para remover)
              </label>
              <TimePicker
                format="HH:mm"
                value={horarioAlmoco ? moment(horarioAlmoco, "HH:mm") : null}
                onChange={(time, timeString) => salvarHorarioAlmoco(timeString)}
              />
            </div>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={() => toast.success("Horário de almoço salvo!")}
            >
              Salvar
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
