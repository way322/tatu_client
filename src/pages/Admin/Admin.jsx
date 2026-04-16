import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchAppointments,
    updateAppointmentStatus,
    deleteAppointment
    // deleteArchivedAppointments — удалён импорт
} from '../../store/slices/appointmentSlice';
import api from '../../api/axios';
import './Admin.css';

const Admin = () => {
    const dispatch = useDispatch();
    const { appointments, loading } = useSelector(state => state.appointment);

    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('pending');
    const [isAuthenticated, setIsAuthenticated] = useState(() => {
        return !!localStorage.getItem('admin_token');
    });

    useEffect(() => {
        if (isAuthenticated) {
            dispatch(fetchAppointments());
        }
    }, [isAuthenticated, dispatch]);

    const sortedAppointments = useMemo(() => {
        return [...appointments].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }, [appointments]);

    const pendingAppointments = sortedAppointments.filter(item => item.status === 'pending');
    const archivedAppointments = sortedAppointments.filter(
        item => item.status === 'completed' || item.status === 'cancelled'
    );

    const activeCount = pendingAppointments.length;
    const archivedCount = archivedAppointments.length;

    const groupByDate = (items) => {
        const groups = {};
        const today = new Date().toISOString().slice(0, 10);
        const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

        items.forEach(item => {
            if (!item.date) {
                groups['Без даты'] = groups['Без даты'] || [];
                groups['Без даты'].push(item);
                return;
            }
            const datePart = item.date.split(' ')[0];
            let displayDate = datePart;
            if (datePart === today) displayDate = 'Сегодня';
            else if (datePart === tomorrow) displayDate = 'Завтра';
            else {
                const [year, month, day] = datePart.split('-');
                displayDate = `${day}.${month}.${year}`;
                if (new Date(datePart) < new Date(today)) {
                    displayDate = `Прошедшие: ${displayDate}`;
                }
            }
            if (!groups[displayDate]) groups[displayDate] = [];
            groups[displayDate].push(item);
        });

        const order = (key) => {
            if (key === 'Сегодня') return 0;
            if (key === 'Завтра') return 1;
            if (key.startsWith('Прошедшие')) return 3;
            return 2;
        };
        return Object.entries(groups).sort((a, b) => order(a[0]) - order(b[0]));
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('/admin/login', { login, password });
            localStorage.setItem('admin_token', response.data.token);
            setIsAuthenticated(true);
            setError('');
            setPassword('');
        } catch (err) {
            setError('Неверный логин или пароль');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('admin_token');
        setIsAuthenticated(false);
        setLogin('');
        setPassword('');
        setError('');
    };

    const handleComplete = (id) => {
        dispatch(updateAppointmentStatus({ id, status: 'completed' }));
    };

    const handleRestoreFromCompleted = (id) => {
        dispatch(updateAppointmentStatus({ id, status: 'pending' }));
    };

    const handleRestoreFromCancelled = (id) => {
        dispatch(updateAppointmentStatus({ id, status: 'pending' }));
    };

    const handleDelete = (id) => {
        const confirmed = window.confirm('Удалить запись?');
        if (confirmed) {
            dispatch(deleteAppointment(id));
        }
    };

    const formatPhone = (phone) => {
        if (!phone) return 'Не указан';
        const cleaned = String(phone).replace(/\D/g, '');
        if (cleaned.length === 11) {
            return `+7 (${cleaned.substring(1, 4)}) ${cleaned.substring(4, 7)}-${cleaned.substring(7, 9)}-${cleaned.substring(9, 11)}`;
        }
        return phone;
    };

    const formatAppointmentDate = (value) => {
        if (!value) return 'Не указано';
        const [datePart, timePart] = value.split(' ');
        if (!datePart) return value;
        const formattedDate = new Date(`${datePart}T00:00:00`).toLocaleDateString('ru-RU');
        return timePart ? `${formattedDate} ${timePart}` : formattedDate;
    };

    const formatDateTime = (value) => {
        if (!value) return '—';
        return new Date(value).toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'completed': return 'Сеанс завершён';
            case 'cancelled': return 'Отменена клиентом';
            default: return 'Активная запись';
        }
    };

    const renderAppointmentCard = (appointment) => {
        const isPending = appointment.status === 'pending';
        const isCompleted = appointment.status === 'completed';
        const isCancelled = appointment.status === 'cancelled';

        return (
            <div key={appointment.id} className="admin-appointment-card">
                <div className="admin-appointment-top">
                    <div>
                        <h3>{appointment.service}</h3>
                        <p className="admin-appointment-id">ID: {appointment.id}</p>
                    </div>
                    <span className={`status-badge ${appointment.status}`}>
                        {getStatusLabel(appointment.status)}
                    </span>
                </div>

                <div className="admin-appointment-info">
                    <p><strong>Клиент:</strong> {appointment.clientName || '—'}</p>
                    <p><strong>Мастер:</strong> {appointment.master || '—'}</p>
                    <p><strong>Дата:</strong> {formatAppointmentDate(appointment.date)}</p>
                    <p><strong>Телефон:</strong> {formatPhone(appointment.phone)}</p>
                    <p><strong>Идея:</strong> {appointment.tattooIdea || '—'}</p>
                    <p><strong>Размер:</strong> {appointment.tattooSize || '—'}</p>
                    <p><strong>Место нанесения:</strong> {appointment.bodyPlacement || '—'}</p>
                    <p><strong>Создано:</strong> {formatDateTime(appointment.createdAt)}</p>
                    <p><strong>Завершено:</strong> {appointment.completedAt ? formatDateTime(appointment.completedAt) : '—'}</p>
                    <p><strong>Отменено:</strong> {appointment.canceledAt ? formatDateTime(appointment.canceledAt) : '—'}</p>
                </div>

                <div className="admin-actions">
                    {isPending && (
                        <button className="status-button primary" onClick={() => handleComplete(appointment.id)}>
                            Отметить как завершённый
                        </button>
                    )}
                    {isCompleted && (
                        <>
                            <button className="status-button secondary" onClick={() => handleRestoreFromCompleted(appointment.id)}>
                                Сделать активной снова
                            </button>
                            <button className="delete-button" onClick={() => handleDelete(appointment.id)}>
                                Удалить
                            </button>
                        </>
                    )}
                    {isCancelled && (
                        <>
                            <button className="status-button secondary" onClick={() => handleRestoreFromCancelled(appointment.id)}>
                                Восстановить запись
                            </button>
                            <button className="delete-button" onClick={() => handleDelete(appointment.id)}>
                                Удалить
                            </button>
                        </>
                    )}
                </div>
            </div>
        );
    };

    const renderTabContent = (items, isArchive = false) => {
        if (items.length === 0) {
            return <div className="admin-empty"><p>Нет записей в этой категории</p></div>;
        }
        const grouped = groupByDate(items);
        return (
            <div className="admin-appointments-list">
                {grouped.map(([dateLabel, dateItems]) => (
                    <div key={dateLabel} className="admin-date-group">
                        <h3 className="admin-date-header">{dateLabel}</h3>
                        {dateItems.map(renderAppointmentCard)}
                    </div>
                ))}
            </div>
        );
    };

    if (!isAuthenticated) {
        return (
            <div className="admin-page">
                <div className="admin-login-card">
                    <h1>Вход в админ-панель</h1>
                    <form onSubmit={handleLogin} className="admin-login-form">
                        <label>
                            Логин
                            <input type="text" value={login} onChange={(e) => setLogin(e.target.value)} placeholder="Введите логин" />
                        </label>
                        <label>
                            Пароль
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Введите пароль" />
                        </label>
                        {error && <p className="admin-error">{error}</p>}
                        <button type="submit" className="admin-login-button">Войти</button>
                    </form>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="admin-page">
                <div className="admin-header">
                    <h1>Загрузка данных...</h1>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-page">
            <div className="admin-header">
                <div>
                    <h1>Админ-панель</h1>
                    <p className="admin-subtitle">Управление записями клиентов</p>
                </div>
                <button onClick={handleLogout} className="admin-logout-button">Выйти</button>
            </div>

            <div className="admin-stats">
                <div className="admin-stat-card">
                    <span className="stat-label">Всего записей</span>
                    <strong>{sortedAppointments.length}</strong>
                </div>
                <div className="admin-stat-card">
                    <span className="stat-label">Активные</span>
                    <strong>{activeCount}</strong>
                </div>
                <div className="admin-stat-card">
                    <span className="stat-label">Архив (завершённые + отменённые)</span>
                    <strong>{archivedCount}</strong>
                </div>
            </div>

            <div className="admin-tabs">
                <button className={`admin-tab ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>
                    Активные ({activeCount})
                </button>
                <button className={`admin-tab ${activeTab === 'archive' ? 'active' : ''}`} onClick={() => setActiveTab('archive')}>
                    Архив ({archivedCount})
                </button>
            </div>

            <div className="admin-tab-content">
                {activeTab === 'pending' && renderTabContent(pendingAppointments, false)}
                {activeTab === 'archive' && renderTabContent(archivedAppointments, true)}
            </div>
        </div>
    );
};

export default Admin;