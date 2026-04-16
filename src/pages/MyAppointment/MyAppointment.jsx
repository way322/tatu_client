import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateAppointmentStatus, fetchAppointmentByPhone } from '../../store/slices/appointmentSlice';
import './MyAppointment.css';

const MyAppointment = () => {
    const dispatch = useDispatch();
    const appointments = useSelector(state => state.appointment.appointments);

    const [phone, setPhone] = useState('');
    const [searchPhone, setSearchPhone] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [searched, setSearched] = useState(false);

    const handlePhoneChange = (value) => {
        const cleaned = value.replace(/\D/g, '');
        let formatted = cleaned;

        if (cleaned.length > 0) {
            formatted = '+7 (' + cleaned.substring(1, 4);
            if (cleaned.length > 4) formatted += ') ' + cleaned.substring(4, 7);
            if (cleaned.length > 7) formatted += '-' + cleaned.substring(7, 9);
            if (cleaned.length > 9) formatted += '-' + cleaned.substring(9, 11);
        }

        setPhone(formatted);
        setSearchPhone(cleaned);
        setError('');
        setSuccessMessage('');
        setSearched(false);
    };

    const activeAppointment = useMemo(() => {
        if (searchPhone.length !== 11) return null;

        return appointments.find((item) => {
            const savedPhone = String(item.phone || '').replace(/\D/g, '');
            return savedPhone === searchPhone && item.status === 'pending';
        }) || null;
    }, [appointments, searchPhone]);

const handleSearch = async (e) => {
  e.preventDefault();
  if (searchPhone.length !== 11) {
    setError('Введите 11 цифр');
    return;
  }
  setSearched(true);
  const result = await dispatch(fetchAppointmentByPhone(searchPhone));
  if (result.error) {
    setError('Активная запись не найдена');
  } else {
    setError('');
  }
};

    const handleCancelAppointment = () => {
        if (!activeAppointment) return;

        dispatch(updateAppointmentStatus({
            id: activeAppointment.id,
            status: 'cancelled'
        }));

        setSuccessMessage('Ваша запись успешно отменена.');
        setSearched(false);
    };

    const formatPhone = (value) => {
        if (!value) return '';

        const cleaned = value.replace(/\D/g, '');

        if (cleaned.length === 11) {
            return `+7 (${cleaned.substring(1, 4)}) ${cleaned.substring(4, 7)}-${cleaned.substring(7, 9)}-${cleaned.substring(9, 11)}`;
        }

        return value;
    };

    return (
        <div className="my-appointment-page">
            <div className="my-appointment-card">
                <h1>Моя запись</h1>
                <p className="my-appointment-subtitle">
                    Введите номер телефона, чтобы найти и отменить активную запись
                </p>

                <form onSubmit={handleSearch} className="my-appointment-form">
                    <label>
                        Номер телефона:
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => handlePhoneChange(e.target.value)}
                            placeholder="+7 (999) 123-45-67"
                        />
                    </label>

                    {error && <p className="my-appointment-error">{error}</p>}
                    {successMessage && <p className="my-appointment-success">{successMessage}</p>}

                    <button type="submit" className="my-appointment-search-button">
                        Найти запись
                    </button>
                </form>

                {searched && activeAppointment && (
                    <div className="my-appointment-result">
                        <h2>Найдена активная запись</h2>
                        <p><strong>Имя:</strong> {activeAppointment.clientName || '—'}</p>
                        <p><strong>Услуга:</strong> {activeAppointment.service || '—'}</p>
                        <p><strong>Мастер:</strong> {activeAppointment.master || '—'}</p>
                        <p><strong>Дата и время:</strong> {activeAppointment.date || '—'}</p>
                        <p><strong>Телефон:</strong> {formatPhone(activeAppointment.phone)}</p>
                        <p><strong>Идея тату:</strong> {activeAppointment.tattooIdea || '—'}</p>
                        <p><strong>Размер:</strong> {activeAppointment.tattooSize || '—'}</p>
                        <p><strong>Место нанесения:</strong> {activeAppointment.bodyPlacement || '—'}</p>

                        <button
                            type="button"
                            className="my-appointment-cancel-button"
                            onClick={handleCancelAppointment}
                        >
                            Отменить запись
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyAppointment;