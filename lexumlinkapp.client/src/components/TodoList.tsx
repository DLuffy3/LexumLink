import { useState, useEffect } from 'react';
import api from '../services/api';
import { format, differenceInDays } from 'date-fns';

interface Todo {
    id: string;
    title: string;
    description: string;
    dueDate: string | null;
    isCompleted: boolean;
    createdAt: string;
    updatedAt: string;
}

export default function TodoList() {
    const [todos, setTodos] = useState<Todo[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ title: '', description: '', dueDate: '' });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchTodos();
    }, []);

    const fetchTodos = async () => {
        try {
            const res = await api.get('/todos');
            setTodos(res.data);
        } catch (err) {
            console.error('Failed to fetch todos', err);
        } finally {
            setLoading(false);
        }
    };

    const getDueDateColor = (dueDate: string | null) => {
        if (!dueDate) return 'border-gray-200 bg-gray-50';
        const daysLeft = differenceInDays(new Date(dueDate), new Date());
        if (daysLeft >= 5) return 'border-l-4 border-green-500 bg-green-50';
        if (daysLeft >= 2 && daysLeft <= 4) return 'border-l-4 border-yellow-500 bg-yellow-50';
        return 'border-l-4 border-red-500 bg-red-50';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title.trim()) return;
        setSubmitting(true);
        try {
            const payload = {
                title: formData.title,
                description: formData.description,
                dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
            };
            if (editingId) {
                await api.put(`/todos/${editingId}`, payload);
            } else {
                await api.post('/todos', payload);
            }
            setIsModalOpen(false);
            resetForm();
            fetchTodos();
        } catch (err) {
            console.error('Failed to save todo', err);
            alert('Failed to save todo');
        } finally {
            setSubmitting(false);
        }
    };

    const toggleComplete = async (id: string) => {
        try {
            await api.patch(`/todos/${id}/toggle`);
            fetchTodos();
        } catch (err) {
            console.error('Failed to toggle todo', err);
        }
    };

    const deleteTodo = async (id: string) => {
        if (!confirm('Are you sure you want to delete this task?')) return;
        try {
            await api.delete(`/todos/${id}`);
            fetchTodos();
        } catch (err) {
            console.error('Failed to delete todo', err);
        }
    };

    const openEditModal = (todo: Todo) => {
        setEditingId(todo.id);
        setFormData({
            title: todo.title,
            description: todo.description,
            dueDate: todo.dueDate ? todo.dueDate.split('T')[0] : '',
        });
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setEditingId(null);
        setFormData({ title: '', description: '', dueDate: '' });
    };

    if (loading) return <div className="text-center py-4">Loading tasks...</div>;

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-800">My To‑Do List</h3>
                <button
                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                    className="bg-red-700 text-white px-3 py-1 rounded-md hover:bg-red-800 flex items-center gap-1"
                >
                    <span className="text-lg font-bold">+</span> Add Task
                </button>
            </div>

            {todos.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No tasks. Click "Add Task" to organize your day.</p>
            ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                    {todos.map((todo) => (
                        <div
                            key={todo.id}
                            className={`p-3 rounded-md shadow-sm transition-all ${getDueDateColor(todo.dueDate)} ${todo.isCompleted ? 'opacity-75' : ''}`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-2 flex-1">
                                    <button onClick={() => toggleComplete(todo.id)} className="mt-0.5">
                                        {todo.isCompleted ? (
                                            <span className="text-green-600 text-lg">✓</span>
                                        ) : (
                                            <span className="text-gray-400 text-lg">○</span>
                                        )}
                                    </button>
                                    <div className="flex-1">
                                        <p className={`font-medium ${todo.isCompleted ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                                            {todo.title}
                                        </p>
                                        {todo.description && (
                                            <p className="text-sm text-gray-500 mt-0.5">{todo.description}</p>
                                        )}
                                        {todo.dueDate && (
                                            <p className="text-xs text-gray-400 mt-1">
                                                Due: {format(new Date(todo.dueDate), 'MMM dd, yyyy')}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => openEditModal(todo)} className="text-gray-500 hover:text-red-600">
                                        <span className="text-sm">✎</span>
                                    </button>
                                    <button onClick={() => deleteTodo(todo.id)} className="text-gray-500 hover:text-red-600">
                                        <span className="text-sm">🗑</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal form */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setIsModalOpen(false)} />
                        <div className="bg-white rounded-lg overflow-hidden shadow-xl transform transition-all sm:max-w-lg sm:w-full">
                            <form onSubmit={handleSubmit}>
                                <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                                        {editingId ? 'Edit Task' : 'New Task'}
                                    </h3>
                                    <div className="space-y-3">
                                        <input
                                            type="text"
                                            placeholder="Task title *"
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                                            required
                                        />
                                        <textarea
                                            placeholder="Description (optional)"
                                            rows={3}
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-md"
                                        />
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date (optional)</label>
                                            <input
                                                type="date"
                                                value={formData.dueDate}
                                                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                                className="w-full px-3 py-2 border rounded-md"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse">
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-700 text-white hover:bg-red-800 sm:ml-3 sm:w-auto disabled:opacity-50"
                                    >
                                        {submitting ? 'Saving...' : (editingId ? 'Update' : 'Add')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-gray-700 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}