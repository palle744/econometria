import React, { useState } from 'react';
import { useWarehouseStore } from '../store/warehouseStore';
import type { Collaborator, CollaboratorDocument } from '../store/warehouseStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Plus, Edit, Trash2, FileText, Upload, X } from 'lucide-react';

export const Collaborators = () => {
    const { collaborators, addCollaborator, updateCollaborator, deleteCollaborator, addCollaboratorDocument, deleteCollaboratorDocument } = useWarehouseStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [selectedCollaborator, setSelectedCollaborator] = useState<Collaborator | null>(null);
    const [showDocsModal, setShowDocsModal] = useState(false);
    const [currentDocs, setCurrentDocs] = useState<CollaboratorDocument[]>([]);

    // Form State
    const [formData, setFormData] = useState<Partial<Collaborator>>({
        name: '',
        birthDate: '',
        gender: '',
        phone: '',
        personalEmail: '',
        corporateEmail: '',
        assignedComputer: false,
        assignedPhone: false,
        position: '',
        salary: 0,
        startDate: '',
        photoUrl: '',
        isActive: true,
        computerBrand: '', computerModel: '', computerSerial: '', computerColor: '',
        phoneBrand: '', phoneModel: '', phoneSerial: '', phoneColor: ''
    });

    const resetForm = () => {
        setFormData({
            name: '',
            birthDate: '',
            gender: '',
            phone: '',
            personalEmail: '',
            corporateEmail: '',
            assignedComputer: false,
            assignedPhone: false,
            position: '',
            salary: 0,
            startDate: '',
            photoUrl: '',
            isActive: true,
            computerBrand: '', computerModel: '', computerSerial: '', computerColor: '',
            phoneBrand: '', phoneModel: '', phoneSerial: '', phoneColor: ''
        });
        setEditingId(null);
    };

    const handleEdit = (collab: Collaborator) => {
        setFormData(collab);
        setEditingId(collab.id);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm('¿Estás seguro de eliminar este colaborador?')) {
            await deleteCollaborator(id);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editingId) {
            await updateCollaborator(editingId, formData);
        } else {
            const newId = Math.random().toString(36).substr(2, 9);
            await addCollaborator({ ...formData, id: newId } as Collaborator);
        }
        setIsModalOpen(false);
        resetForm();
    };

    const handleOpenDocs = async (collab: Collaborator) => {
        setSelectedCollaborator(collab);
        // Fetch docs for this collaborator
        const res = await fetch(`/api/collaborators/${collab.id}`);
        const data = await res.json();
        setCurrentDocs(data.documents || []);
        setShowDocsModal(true);
    };


    const handleDeleteDoc = async (docId: string) => {
        if (confirm('¿Eliminar documento?')) {
            await deleteCollaboratorDocument(docId);
            setCurrentDocs(currentDocs.filter(d => d.id !== docId));
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Colaboradores (RRHH)</h1>
                <Button onClick={() => { resetForm(); setIsModalOpen(true); }}>
                    <Plus className="mr-2 h-4 w-4" /> Nuevo Colaborador
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {collaborators.map(collab => (
                    <Card key={collab.id} className={`overflow-hidden ${!collab.isActive ? 'opacity-75 bg-gray-50' : ''}`}>
                        <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-500 relative">
                            {collab.photoUrl && (
                                <img src={collab.photoUrl} alt={collab.name} className="absolute bottom-0 left-4 transform translate-y-1/2 w-20 h-20 rounded-full border-4 border-white object-cover" />
                            )}
                            {!collab.photoUrl && (
                                <div className="absolute bottom-0 left-4 transform translate-y-1/2 w-20 h-20 rounded-full border-4 border-white bg-gray-300 flex items-center justify-center text-2xl font-bold text-white">
                                    {collab.name.charAt(0)}
                                </div>
                            )}
                            <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-bold text-white ${collab.isActive ? 'bg-green-500' : 'bg-red-500'}`}>
                                {collab.isActive ? 'ACTIVO' : 'INACTIVO'}
                            </div>
                        </div>
                        <CardContent className="pt-12 mt-2 space-y-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-lg">{collab.name}</h3>
                                    <p className="text-sm text-muted-foreground">{collab.position}</p>
                                </div>
                                <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" onClick={() => handleOpenDocs(collab)} title="Documentos">
                                        <FileText className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleEdit(collab)}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(collab.id)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            </div>

                            <div className="text-sm space-y-1">
                                <p><strong>Email Corp:</strong> {collab.corporateEmail}</p>
                                <p><strong>Teléfono:</strong> {collab.phone}</p>
                                <p><strong>Inicio:</strong> {collab.startDate}</p>
                                <p><strong>Estado:</strong> <span className={collab.isActive ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>{collab.isActive ? 'Activo' : 'Inactivo'}</span></p>
                                <div className="flex flex-col gap-1 mt-2">
                                    {collab.assignedComputer && (
                                        <div className="text-xs bg-green-50 p-1 rounded border border-green-200">
                                            <span className="font-bold text-green-800">PC:</span> {collab.computerBrand} {collab.computerModel}
                                        </div>
                                    )}
                                    {collab.assignedPhone && (
                                        <div className="text-xs bg-blue-50 p-1 rounded border border-blue-200">
                                            <span className="font-bold text-blue-800">Tel:</span> {collab.phoneBrand} {collab.phoneModel}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Modal Form */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <CardHeader>
                            <CardTitle>{editingId ? 'Editar Colaborador' : 'Nuevo Colaborador'}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Nombre Completo</label>
                                        <Input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Puesto</label>
                                        <Input required value={formData.position} onChange={e => setFormData({ ...formData, position: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Fecha Nacimiento</label>
                                        <Input type="date" value={formData.birthDate} onChange={e => setFormData({ ...formData, birthDate: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Sexo</label>
                                        <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })}>
                                            <option value="">Seleccionar...</option>
                                            <option value="M">Masculino</option>
                                            <option value="F">Femenino</option>
                                            <option value="O">Otro</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Teléfono</label>
                                        <Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Email Personal</label>
                                        <Input type="email" value={formData.personalEmail} onChange={e => setFormData({ ...formData, personalEmail: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Email Corporativo</label>
                                        <Input type="email" value={formData.corporateEmail} onChange={e => setFormData({ ...formData, corporateEmail: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Salario Mensual</label>
                                        <Input type="number" value={formData.salary} onChange={e => setFormData({ ...formData, salary: Number(e.target.value) })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Fecha Inicio</label>
                                        <Input type="date" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Foto</label>
                                        <div className="flex gap-2 items-center">
                                            <Input
                                                type="file"
                                                accept="image/*"
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (!file) return;

                                                    const formData = new FormData();
                                                    formData.append('file', file);

                                                    try {
                                                        const res = await fetch('/api/upload', {
                                                            method: 'POST',
                                                            body: formData
                                                        });

                                                        if (!res.ok) {
                                                            const errData = await res.json().catch(() => ({ error: res.statusText }));
                                                            throw new Error(errData.error || 'Error en el servidor');
                                                        }

                                                        const data = await res.json();

                                                        if (data.url) {
                                                            setFormData(prev => ({ ...prev, photoUrl: data.url }));
                                                        }
                                                    } catch (error: any) {
                                                        console.error('Error uploading photo:', error);
                                                        alert('Error al subir la imagen');
                                                    }
                                                }}
                                            />
                                            {formData.photoUrl && (
                                                <div className="h-10 w-10 rounded-full overflow-hidden border">
                                                    <img src={formData.photoUrl} alt="Preview" className="h-full w-full object-cover" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-2 flex-wrap items-center bg-muted/20 p-2 rounded">
                                    <label className="flex items-center gap-2 text-sm font-bold cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4"
                                            checked={formData.isActive !== false}
                                            onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                                        />
                                        Colaborador Activo
                                    </label>
                                    <div className="h-4 w-px bg-gray-300 mx-2"></div>
                                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                                        <input type="checkbox" checked={formData.assignedComputer} onChange={e => setFormData({ ...formData, assignedComputer: e.target.checked })} />
                                        Asignación de Computadora
                                    </label>
                                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                                        <input type="checkbox" checked={formData.assignedPhone} onChange={e => setFormData({ ...formData, assignedPhone: e.target.checked })} />
                                        Asignación de Teléfono
                                    </label>
                                </div>

                                {/* Asset Details Section */}
                                {(formData.assignedComputer || formData.assignedPhone) && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/10 p-4 rounded border">
                                        {formData.assignedComputer && (
                                            <div className="space-y-2 border-r pr-4">
                                                <h4 className="font-bold text-sm text-green-700">Detalles Computadora</h4>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <label className="text-xs font-medium">Marca</label>
                                                        <Input className="h-8" value={formData.computerBrand} onChange={e => setFormData({ ...formData, computerBrand: e.target.value })} />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-medium">Modelo</label>
                                                        <Input className="h-8" value={formData.computerModel} onChange={e => setFormData({ ...formData, computerModel: e.target.value })} />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-medium">No. Serie</label>
                                                        <Input className="h-8" value={formData.computerSerial} onChange={e => setFormData({ ...formData, computerSerial: e.target.value })} />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-medium">Color</label>
                                                        <Input className="h-8" value={formData.computerColor} onChange={e => setFormData({ ...formData, computerColor: e.target.value })} />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {formData.assignedPhone && (
                                            <div className="space-y-2 pl-2">
                                                <h4 className="font-bold text-sm text-blue-700">Detalles Teléfono</h4>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <label className="text-xs font-medium">Marca</label>
                                                        <Input className="h-8" value={formData.phoneBrand} onChange={e => setFormData({ ...formData, phoneBrand: e.target.value })} />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-medium">Modelo</label>
                                                        <Input className="h-8" value={formData.phoneModel} onChange={e => setFormData({ ...formData, phoneModel: e.target.value })} />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-medium">No. Serie/IMEI</label>
                                                        <Input className="h-8" value={formData.phoneSerial} onChange={e => setFormData({ ...formData, phoneSerial: e.target.value })} />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-medium">Color</label>
                                                        <Input className="h-8" value={formData.phoneColor} onChange={e => setFormData({ ...formData, phoneColor: e.target.value })} />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="flex justify-end gap-2 pt-4">
                                    <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                                    <Button type="submit">Guardar</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Documents Modal */}
            {showDocsModal && selectedCollaborator && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-lg">
                        <CardHeader className="flex flex-row justify-between items-center">
                            <CardTitle>Documentos: {selectedCollaborator.name}</CardTitle>
                            <Button variant="ghost" size="icon" onClick={() => setShowDocsModal(false)}><X className="h-4 w-4" /></Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-end items-center gap-2">
                                <label className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-3">
                                    <Upload className="mr-2 h-4 w-4" /> Subir PDF
                                    <input
                                        type="file"
                                        accept=".pdf"
                                        className="hidden"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file || !selectedCollaborator) return;

                                            const formData = new FormData();
                                            formData.append('file', file);

                                            try {
                                                const res = await fetch('/api/upload', {
                                                    method: 'POST',
                                                    body: formData
                                                });

                                                if (!res.ok) {
                                                    const errData = await res.json().catch(() => ({ error: res.statusText }));
                                                    throw new Error(errData.error || 'Error en el servidor');
                                                }

                                                const data = await res.json();

                                                if (data.url) {
                                                    const newDoc: CollaboratorDocument = {
                                                        id: Math.random().toString(36).substr(2, 9),
                                                        collaboratorId: selectedCollaborator.id,
                                                        name: file.name,
                                                        type: 'pdf',
                                                        url: data.url,
                                                        uploadDate: new Date().toISOString()
                                                    };

                                                    await addCollaboratorDocument(newDoc);
                                                    setCurrentDocs([...currentDocs, newDoc]);
                                                }
                                            } catch (error: any) {
                                                console.error('Error uploading document:', error);
                                                alert(`Error al subir el documento: ${error.message}`);
                                            }
                                            // Reset input
                                            e.target.value = '';
                                        }}
                                    />
                                </label>
                            </div>

                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {currentDocs.length === 0 && <p className="text-center text-muted-foreground text-sm">No hay documentos.</p>}
                                {currentDocs.map(doc => (
                                    <div key={doc.id} className="flex justify-between items-center p-2 border rounded bg-muted/50">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <FileText className="h-4 w-4 flex-shrink-0" />
                                            <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline truncate">
                                                {doc.name}
                                            </a>
                                            <span className="text-xs text-muted-foreground">({new Date(doc.uploadDate).toLocaleDateString()})</span>
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={() => handleDeleteDoc(doc.id)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
};
