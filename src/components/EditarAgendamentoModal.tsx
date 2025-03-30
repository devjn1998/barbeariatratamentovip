import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { updateAppointment } from "../services/appointments";
import { AppointmentStatus, NormalizedAppointment } from "../types/appointment";

interface EditarAgendamentoModalProps {
  agendamento: NormalizedAppointment;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export default function EditarAgendamentoModal({
  agendamento,
  isOpen,
  onClose,
  onSave,
}: EditarAgendamentoModalProps) {
  const [formData, setFormData] = useState({
    date: agendamento.date,
    time: agendamento.time,
    clientName: agendamento.clientName,
    clientPhone: agendamento.clientPhone,
    service: agendamento.service,
    status: agendamento.status,
  });
  const [loading, setLoading] = useState(false);

  // Atualizar formData se o agendamento prop mudar
  useEffect(() => {
    setFormData({
      date: agendamento.date,
      time: agendamento.time,
      clientName: agendamento.clientName,
      clientPhone: agendamento.clientPhone,
      service: agendamento.service,
      status: agendamento.status,
    });
  }, [agendamento]);

  // Manipulador de mudança de campo
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Manipulador de envio do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      // Preparar dados para atualização, incluindo o status
      const updateData = {
        date: formData.date,
        time: formData.time,
        clientName: formData.clientName,
        clientPhone: formData.clientPhone,
        service: formData.service,
        status: formData.status,
      };

      // Atualizar agendamento
      await updateAppointment(agendamento.id, updateData);

      toast.success("Agendamento atualizado com sucesso!");
      onSave();
      onClose();
    } catch (error) {
      console.error("Erro ao atualizar agendamento:", error);
      toast.error("Erro ao atualizar agendamento");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <h3 className="text-lg font-bold mb-4">Editar Agendamento</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Horário
            </label>
            <input
              type="time"
              name="time"
              value={formData.time}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome do Cliente
            </label>
            <input
              type="text"
              name="clientName"
              value={formData.clientName}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telefone
            </label>
            <input
              type="text"
              name="clientPhone"
              value={formData.clientPhone}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Serviço
            </label>
            <input
              type="text"
              name="service"
              value={formData.service}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
              required
            >
              <option value="aguardando pagamento">Aguardando Pagamento</option>
              <option value="confirmado">Confirmado</option>
              <option value={AppointmentStatus.CANCELED}>Cancelado</option>
            </select>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-colors"
              disabled={loading}
            >
              {loading ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
