import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
    setAppointmentData,
    addAppointment,
    clearLastAppointment,
    clearBookingError
} from '../../store/slices/appointmentSlice';
import AppointmentSuccess from '../../components/AppointmentSuccess/AppointmentSuccess';
import './Appointment.css';

import alexeyPhoto from '../../assets/images/masters/alexey.png';
import mariaPhoto from '../../assets/images/masters/maria.png';
import dmitryPhoto from '../../assets/images/masters/dmitry.png';
import olgaPhoto from '../../assets/images/masters/olga.png';

const Appointment = () => {
    const {
        currentAppointment,
        masters,
        appointments
    } = useSelector(state => state.appointment);

    const servicesList = useSelector(state => state.services.services);
    const dispatch = useDispatch();

    const [step, setStep] = useState(1);
    const [phone, setPhone] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const [formError, setFormError] = useState('');
    const [isConfirmed, setIsConfirmed] = useState(false);

    const timeSlots = ['10:00', '12:00', '14:00', '16:00', '18:00', '20:00'];

    const getLocalDateString = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    };

    const getMasterPhoto = (masterName) => {
        switch (masterName) {
            case 'Алексей':
                return alexeyPhoto;
            case 'Мария':
                return mariaPhoto;
            case 'Дмитрий':
                return dmitryPhoto;
            case 'Ольга':
                return olgaPhoto;
            default:
                return alexeyPhoto;
        }
    };

    const handleInputChange = (field, value) => {
        setFormError('');
        setIsConfirmed(false);
        dispatch(clearBookingError());
        dispatch(setAppointmentData({ [field]: value }));
    };

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
        setFormError('');
        setIsConfirmed(false);
        dispatch(clearBookingError());
        dispatch(setAppointmentData({ phone: cleaned }));
    };

    const isPastTimeSlot = (date, time) => {
        if (!date || !time) return false;

        const today = getLocalDateString();

        if (date !== today) return false;

        const [hours, minutes] = time.split(':').map(Number);
        const slotDate = new Date();

        slotDate.setHours(hours, minutes, 0, 0);

        return slotDate.getTime() <= Date.now();
    };

    const isMasterBusy = () => {
        return appointments.some(
            (item) =>
                item.master === currentAppointment.master &&
                item.date === currentAppointment.date &&
                item.status === 'pending'
        );
    };

    const hasActiveAppointmentByPhone = () => {
        const currentPhone = String(currentAppointment.phone || '').replace(/\D/g, '');

        return appointments.some((item) => {
            const savedPhone = String(item.phone || '').replace(/\D/g, '');
            return savedPhone === currentPhone && item.status === 'pending';
        });
    };

    const isSelectedDateTimeInPast = () => {
        if (!currentAppointment.date) return false;

        const [datePart, timePart] = currentAppointment.date.split(' ');

        if (!datePart || !timePart) return false;

        return isPastTimeSlot(datePart, timePart);
    };

    const duplicatePhoneError =
        currentAppointment.phone.length === 11 && hasActiveAppointmentByPhone()
            ? 'На этот номер уже есть активная запись. Новую запись можно оформить только после завершения или отмены предыдущей.'
            : '';

    const handleSubmit = (e) => {
        e.preventDefault();
        setFormError('');

        if (
            !currentAppointment.clientName.trim() ||
            !currentAppointment.date ||
            !currentAppointment.master ||
            !currentAppointment.service ||
            currentAppointment.phone.length !== 11
        ) {
            setFormError('Пожалуйста, заполните все обязательные поля корректно.');
            return;
        }

        if (duplicatePhoneError) {
            setFormError(duplicatePhoneError);
            return;
        }

        if (isSelectedDateTimeInPast()) {
            setFormError('Нельзя записаться на прошедшее время. Пожалуйста, выберите другой слот.');
            return;
        }

        if (isMasterBusy()) {
            setFormError('На выбранные дату и время этот мастер уже записан. Пожалуйста, выберите другое время.');
            return;
        }

        if (!isConfirmed) {
            setFormError('Подтвердите, пожалуйста, корректность данных перед отправкой.');
            return;
        }

        dispatch(addAppointment({
            clientName: currentAppointment.clientName,
            date: currentAppointment.date,
            master: currentAppointment.master,
            service: currentAppointment.service,
            phone: currentAppointment.phone,
            tattooIdea: currentAppointment.tattooIdea,
            tattooSize: currentAppointment.tattooSize,
            bodyPlacement: currentAppointment.bodyPlacement
        })).unwrap().then(() => {
            setIsSuccess(true);
        }).catch((err) => {
            setFormError(err.message || 'Ошибка при записи');
        });
    };

    useEffect(() => {
        dispatch(clearLastAppointment());
        dispatch(clearBookingError());
    }, [dispatch]);

    const isFormValid = () => {
        return (
            currentAppointment.clientName.trim() &&
            currentAppointment.date &&
            currentAppointment.master &&
            currentAppointment.service &&
            currentAppointment.phone.length === 11 &&
            !duplicatePhoneError &&
            isConfirmed
        );
    };

    if (isSuccess) {
        return <AppointmentSuccess />;
    }

    return (
        <div className="appointment">
            <h1>Записаться на сеанс</h1>

            <div className="appointment-steps">
                <div className={`step ${step >= 1 ? 'active' : ''}`}>1. Выбор услуги</div>
                <div className={`step ${step >= 2 ? 'active' : ''}`}>2. Выбор мастера</div>
                <div className={`step ${step >= 3 ? 'active' : ''}`}>3. Дата и время</div>
                <div className={`step ${step >= 4 ? 'active' : ''}`}>4. Контакты</div>
            </div>

            <form onSubmit={handleSubmit} className="appointment-form">
                {step === 1 && (
                    <div className="form-step">
                        <h2>Выберите услугу</h2>
                        <div className="services-grid">
                            {servicesList.map(service => (
                                <div
                                    key={service.id}
                                    className={`service-option ${currentAppointment.service === service.title ? 'selected' : ''}`}
                                    onClick={() => {
                                        handleInputChange('service', service.title);
                                        setStep(2);
                                    }}
                                >
                                    <h3>{service.title}</h3>
                                    <p>{service.description}</p>
                                    <span className="price">{service.price}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="form-step">
                        <h2>Выберите мастера</h2>
                        <div className="masters-grid">
                            {masters.map(master => (
                                <div
                                    key={master.id}
                                    className={`master-option ${currentAppointment.master === master.name ? 'selected' : ''}`}
                                    onClick={() => {
                                        handleInputChange('master', master.name);
                                        setStep(3);
                                    }}
                                >
                                    <div className="master-photo">
                                        <img
                                            src={getMasterPhoto(master.name)}
                                            alt={`Мастер ${master.name}`}
                                            className="master-photo-img"
                                        />
                                    </div>
                                    <h3>{master.name}</h3>
                                    <p>Стиль: {master.specialization}</p>
                                    <p>Опыт: {master.experience}</p>
                                </div>
                            ))}
                        </div>

                        <button type="button" onClick={() => setStep(1)} className="back-button">
                            Назад
                        </button>
                    </div>
                )}

                {step === 3 && (
                    <div className="form-step">
                        <h2>Выберите дату и время</h2>

                        <div className="date-selection">
                            <label>
                                Дата:
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => {
                                        setSelectedDate(e.target.value);
                                        handleInputChange('date', '');
                                    }}
                                    min={getLocalDateString()}
                                />
                            </label>

                            <div className="time-slots">
                                <h4>Доступное время:</h4>

                                <div className="slots-grid">
                                    {timeSlots.map(time => {
                                        const fullDate = `${selectedDate} ${time}`;

                                        const isBusySlot = appointments.some(
                                            (item) =>
                                                item.master === currentAppointment.master &&
                                                item.date === fullDate &&
                                                item.status === 'pending'
                                        );

                                        const isPastSlot = isPastTimeSlot(selectedDate, time);
                                        const isUnavailable = isBusySlot || isPastSlot;

                                        return (
                                            <div
                                                key={time}
                                                className={`time-slot ${currentAppointment.date === fullDate ? 'selected' : ''} ${isUnavailable ? 'busy' : ''}`}
                                                onClick={() => {
                                                    if (!selectedDate) {
                                                        return;
                                                    }

                                                    if (isPastSlot || isBusySlot) {
                                                        return;
                                                    }

                                                    setFormError('');
                                                    handleInputChange('date', fullDate);
                                                }}
                                            >
                                                {time} {isPastSlot ? '(прошло)' : isBusySlot ? '(занято)' : ''}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {currentAppointment.date && (
                                <div className="selected-time-info">
                                    <p>Выбрано: {currentAppointment.date}</p>
                                </div>
                            )}
                        </div>

                        <div className="step-buttons">
                            <button type="button" onClick={() => setStep(2)} className="back-button">
                                Назад
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    if (currentAppointment.date) {
                                        setStep(4);
                                        setFormError('');
                                    }
                                }}
                                className="next-button"
                            >
                                Далее
                            </button>
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className="form-step">
                        <h2>Ваши контактные данные</h2>

                        <div className="contact-form">
                            <label>
                                Ваше имя:
                                <input
                                    type="text"
                                    value={currentAppointment.clientName}
                                    onChange={(e) => handleInputChange('clientName', e.target.value)}
                                    placeholder="Например, Анна"
                                    required
                                />
                            </label>

                            <label>
                                Номер телефона:
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => handlePhoneChange(e.target.value)}
                                    placeholder="+7 (999) 123-45-67"
                                    required
                                />
                            </label>

                            <p className="phone-note">
                                Мы свяжемся с вами по этому номеру для подтверждения записи
                            </p>

                            {(duplicatePhoneError || formError) && (
                                <p className="booking-error">{duplicatePhoneError || formError}</p>
                            )}

                            <label>
                                Идея тату:
                                <textarea
                                    value={currentAppointment.tattooIdea}
                                    onChange={(e) => handleInputChange('tattooIdea', e.target.value)}
                                    placeholder="Опишите идею или стиль татуировки"
                                    rows="3"
                                />
                            </label>

                            <label>
                                Размер:
                                <input
                                    type="text"
                                    value={currentAppointment.tattooSize}
                                    onChange={(e) => handleInputChange('tattooSize', e.target.value)}
                                    placeholder="Например, 10x15 см"
                                />
                            </label>

                            <label>
                                Место нанесения:
                                <input
                                    type="text"
                                    value={currentAppointment.bodyPlacement}
                                    onChange={(e) => handleInputChange('bodyPlacement', e.target.value)}
                                    placeholder="Например, предплечье"
                                />
                            </label>

                            <label className="confirm-checkbox">
                                <input
                                    type="checkbox"
                                    checked={isConfirmed}
                                    onChange={(e) => {
                                        setIsConfirmed(e.target.checked);
                                        setFormError('');
                                    }}
                                />
                                <span>Подтверждаю, что все данные указаны верно</span>
                            </label>
                        </div>

                        <div className="appointment-summary">
                            <h3>Ваша запись:</h3>
                            <p><strong>Имя:</strong> {currentAppointment.clientName || '—'}</p>
                            <p><strong>Услуга:</strong> {currentAppointment.service}</p>
                            <p><strong>Мастер:</strong> {currentAppointment.master}</p>
                            <p><strong>Дата:</strong> {currentAppointment.date}</p>
                            <p><strong>Телефон:</strong> {phone}</p>
                            <p><strong>Идея:</strong> {currentAppointment.tattooIdea || '—'}</p>
                            <p><strong>Размер:</strong> {currentAppointment.tattooSize || '—'}</p>
                            <p><strong>Место нанесения:</strong> {currentAppointment.bodyPlacement || '—'}</p>
                        </div>

                        <div className="step-buttons">
                            <button type="button" onClick={() => setStep(3)} className="back-button">
                                Назад
                            </button>

                            <button
                                type="submit"
                                className={`submit-button ${!isFormValid() ? 'disabled' : ''}`}
                                disabled={!isFormValid()}
                            >
                                Подтвердить запись
                            </button>
                        </div>
                    </div>
                )}
            </form>
        </div>
    );
};

export default Appointment;