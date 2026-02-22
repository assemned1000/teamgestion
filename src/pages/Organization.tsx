import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User, ZoomIn, ZoomOut } from 'lucide-react';
import { useEnterprise } from '../contexts/EnterpriseContext';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  photo_url: string | null;
  role: string;
  email: string;
  phone: string | null;
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  photo_url: string | null;
  position: string;
  status: string;
  client_id?: string;
}

interface Client {
  id: string;
  name: string;
  manager_id: string | null;
}

interface EmployeeWithClient extends Employee {
  client_name?: string;
}

interface SuperviseurStructure {
  superviseur: Employee;
  employees: EmployeeWithClient[];
}

interface ClientStructure {
  client: Client;
  superviseurs: SuperviseurStructure[];
  directEmployees: EmployeeWithClient[];
}

interface ManagerStructure {
  manager: Employee;
  clients: ClientStructure[];
}

interface OrgStructure {
  directeur_general: Profile | null;
  manager_generals: Employee[];
  managers: ManagerStructure[];
  unassignedClients: ClientStructure[];
}

export const Organization = () => {
  const { currentEnterprise, loading: enterpriseLoading } = useEnterprise();
  const [orgStructure, setOrgStructure] = useState<OrgStructure | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<{ type: 'admin' | 'manager' | 'client' | 'superviseur' | 'employee'; data: any } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [dragDistance, setDragDistance] = useState(0);
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (!enterpriseLoading && currentEnterprise) {
      loadOrganization();
    }
  }, [currentEnterprise?.id, enterpriseLoading]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (containerRef) {
      setIsDragging(true);
      setDragDistance(0);
      setStartPos({
        x: e.clientX + containerRef.scrollLeft,
        y: e.clientY + containerRef.scrollTop
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && containerRef) {
      e.preventDefault();
      const dx = e.clientX + containerRef.scrollLeft - startPos.x;
      const dy = e.clientY + containerRef.scrollTop - startPos.y;

      setDragDistance(Math.abs(dx) + Math.abs(dy));

      containerRef.scrollLeft = startPos.x - e.clientX;
      containerRef.scrollTop = startPos.y - e.clientY;
    }
  };

  const handleMouseUp = () => {
    setTimeout(() => {
      setIsDragging(false);
      setDragDistance(0);
    }, 0);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    setDragDistance(0);
  };

  const handleItemClick = (callback: () => void) => () => {
    if (dragDistance < 5) {
      callback();
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.1, 0.5));
  };

  const handleResetZoom = () => {
    setZoom(1);
  };

  const loadOrganization = async () => {
    if (!currentEnterprise) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const [profilesRes, employeesRes, clientsRes, ratesRes] = await Promise.all([
      supabase.from('profiles').select('*'),
      supabase.from('employees').select('id, first_name, last_name, photo_url, position, status').eq('status', 'Actif').eq('enterprise_id', currentEnterprise.id),
      supabase.from('clients').select('id, name, manager_id').eq('enterprise_id', currentEnterprise.id),
      supabase.from('employee_client_rates').select('id, employee_id, client_id').eq('enterprise_id', currentEnterprise.id),
    ]);

    if (profilesRes.data && employeesRes.data && clientsRes.data && ratesRes.data) {
      // Find directeur_general (role='directeur_general')
      const directeur_general = profilesRes.data.find(p => p.role === 'directeur_general') || null;

      // Find manager generals from employees (position contains 'Manager General' or 'Manager Général')
      const managerGeneralEmployees = employeesRes.data.filter(e =>
        e.position && (
          e.position.toLowerCase().includes('manager general') ||
          e.position.toLowerCase().includes('manager général')
        )
      );

      // Find managers from employees (position contains 'Manager' but not 'Manager General' and not 'Communité manager')
      const managerEmployees = employeesRes.data.filter(e => {
        const pos = e.position ? e.position.toLowerCase() : '';
        return pos.includes('manager') &&
               !pos.includes('manager general') &&
               !pos.includes('manager général') &&
               !pos.includes('communité manager');
      });

      // Build all client structures
      const allClientStructures: ClientStructure[] = clientsRes.data.map(client => {
        const clientEmployeeIds = ratesRes.data
          .filter(r => r.client_id === client.id)
          .map(r => r.employee_id);

        const allClientEmployees = employeesRes.data.filter(e =>
          clientEmployeeIds.includes(e.id) &&
          !managerGeneralEmployees.some(mg => mg.id === e.id)
        ).map(e => ({ ...e, client_name: client.name }));

        const superviseursOnly = allClientEmployees.filter(e =>
          e.position && e.position.toLowerCase().includes('superviseur')
        );

        const otherEmployees = allClientEmployees.filter(e =>
          !e.position || !e.position.toLowerCase().includes('superviseur')
        );

        return {
          client,
          superviseurs: [],
          directEmployees: [...superviseursOnly, ...otherEmployees],
        };
      });

      // Group clients by their manager
      const managerStructures: ManagerStructure[] = managerEmployees.map(manager => {
        const managerClients = allClientStructures.filter(cs => cs.client.manager_id === manager.id);
        return {
          manager,
          clients: managerClients,
        };
      });

      // Get clients without a manager
      const assignedClientIds = managerStructures.flatMap(ms => ms.clients.map(c => c.client.id));
      const unassignedClients = allClientStructures.filter(cs => !assignedClientIds.includes(cs.client.id));

      setOrgStructure({
        directeur_general,
        manager_generals: managerGeneralEmployees,
        managers: managerStructures,
        unassignedClients,
      });
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-300"></div>
      </div>
    );
  }

  const renderEmployeeCard = (employee: Employee, label?: string) => {
    return (
      <div key={employee.id} className="flex flex-col items-center">
        <div
          className="flex flex-col items-center cursor-pointer group"
          onClick={handleItemClick(() => setSelectedItem({ type: 'manager', data: employee }))}
        >
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-elevated flex items-center justify-center text-white text-lg md:text-xl font-bold shadow-lg group-hover:scale-110 transition-transform ring-2 ring-gray-300">
            {employee.photo_url ? (
              <img src={employee.photo_url} alt={employee.first_name} className="w-full h-full rounded-full object-cover" />
            ) : (
              `${employee.first_name[0]}${employee.last_name[0]}`
            )}
          </div>
          <p className="font-bold text-sm md:text-base text-white mt-2 text-center">
            {employee.first_name} {employee.last_name}
          </p>
          <p className="text-xs text-gray-300 font-medium uppercase text-center">{label || employee.position}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-[1400px] mx-auto px-6 lg:px-8 py-8">
      <div className="mb-6 md:mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Organisation Interne</h1>
          <p className="text-sm md:text-base text-gray-300">Structure hiérarchique de l'entreprise</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            className="p-2 bg-surface hover:bg-[#3d3d3d] rounded-lg transition-colors"
            title="Zoom out"
          >
            <ZoomOut className="text-white" size={20} />
          </button>
          <button
            onClick={handleResetZoom}
            className="px-3 py-2 bg-surface hover:bg-[#3d3d3d] rounded-lg transition-colors text-white text-sm font-medium"
            title="Reset zoom"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            onClick={handleZoomIn}
            className="p-2 bg-surface hover:bg-[#3d3d3d] rounded-lg transition-colors"
            title="Zoom in"
          >
            <ZoomIn className="text-white" size={20} />
          </button>
        </div>
      </div>

      {orgStructure && (
        <div
          ref={setContainerRef}
          className="overflow-auto scrollbar-hidden space-y-6 md:space-y-8 select-none"
          style={{
            cursor: isDragging ? 'grabbing' : 'grab',
            maxHeight: 'calc(100vh - 200px)'
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        >
          <div className="inline-block min-w-full" style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top center',
            transition: 'transform 0.2s ease-out'
          }}>
          {/* Level 1: Directeur General */}
          {orgStructure.directeur_general && (
            <div className="flex flex-col items-center mb-8 md:mb-12">
              <div
                className="flex flex-col items-center cursor-pointer group"
                onClick={handleItemClick(() => setSelectedItem({ type: 'admin', data: orgStructure.directeur_general }))}
              >
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-elevated flex items-center justify-center text-white text-2xl md:text-3xl font-bold mb-3 md:mb-4 group-hover:scale-110 transition-transform shadow-2xl ring-4 ring-gray-300">
                  {orgStructure.directeur_general.photo_url ? (
                    <img src={orgStructure.directeur_general.photo_url} alt={orgStructure.directeur_general.first_name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    `${orgStructure.directeur_general.first_name[0]}${orgStructure.directeur_general.last_name[0]}`
                  )}
                </div>
                <p className="font-bold text-xl md:text-2xl text-white">
                  {orgStructure.directeur_general.first_name} {orgStructure.directeur_general.last_name}
                </p>
                <p className="text-xs md:text-sm text-white font-semibold uppercase tracking-wide">Directeur Général</p>
                <p className="text-xs text-gray-300 mt-1">{orgStructure.directeur_general.email}</p>
              </div>

              {/* Connecting line to manager generals */}
              {(orgStructure.manager_generals.length > 0 || orgStructure.managers.length > 0) && (
                <div className="relative mt-4 md:mt-6">
                  <div className="h-8 md:h-12 w-0.5 bg-gray-300 mx-auto"></div>
                  {(orgStructure.manager_generals.length > 1 || orgStructure.managers.length > 1) && (
                    <div
                      className="absolute top-full left-1/2 -translate-x-1/2 h-0.5 bg-gray-300"
                      style={{
                        width: `${Math.min((orgStructure.manager_generals.length + orgStructure.managers.length) * 200, 800)}px`,
                      }}
                    ></div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Level 2: Manager Generals in horizontal row */}
          {orgStructure.manager_generals.length > 0 && (
            <>
              <div className="overflow-x-auto scrollbar-hidden pb-4">
                <div className="flex gap-8 md:gap-16 justify-center min-w-max px-4">
                  {orgStructure.manager_generals.map(manager => renderEmployeeCard(manager))}
                </div>
              </div>
              {(orgStructure.managers.length > 0 || orgStructure.unassignedClients.length > 0) && (
                <div className="flex justify-center my-4">
                  <div className="h-8 w-0.5 bg-gray-300"></div>
                </div>
              )}
            </>
          )}

          {/* Level 3: Managers in horizontal row */}
          {orgStructure.managers.length > 0 && (
            <>
              <div className="overflow-x-auto scrollbar-hidden pb-4">
                <div className="flex gap-8 md:gap-16 justify-center min-w-max px-4">
                  {orgStructure.managers.map(managerStructure => (
                    <div key={managerStructure.manager.id} className="flex flex-col items-center">
                      {renderEmployeeCard(managerStructure.manager)}
                      {managerStructure.clients.length > 0 && (
                        <div className="relative mt-4">
                          <div className="h-8 w-0.5 bg-gray-300 mx-auto"></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Level 4: All Clients in horizontal row */}
          {(orgStructure.managers.some(m => m.clients.length > 0) || orgStructure.unassignedClients.length > 0) && (
            <>
              <div className="overflow-x-auto scrollbar-hidden pb-4">
                <div className="flex gap-8 md:gap-16 justify-center min-w-max px-4">
                  {orgStructure.managers.flatMap(m => m.clients).concat(orgStructure.unassignedClients).map(clientStructure => {
                    const employeeCount = clientStructure.directEmployees.length;
                    const hasEmployees = employeeCount > 0;

                    return (
                      <div key={clientStructure.client.id} className="flex flex-col items-center">
                        <div
                          className="flex flex-col items-center cursor-pointer group"
                          onClick={handleItemClick(() => setSelectedItem({ type: 'client', data: clientStructure.client }))}
                        >
                          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-blue-600 flex items-center justify-center text-white text-lg md:text-xl font-bold shadow-lg group-hover:scale-110 transition-transform ring-2 ring-blue-400">
                            {clientStructure.client.name[0]}
                          </div>
                          <p className="font-bold text-sm md:text-base text-white mt-2 text-center">
                            {clientStructure.client.name}
                          </p>
                          <p className="text-xs text-gray-300 font-medium uppercase text-center">Client</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {employeeCount} employé{employeeCount !== 1 ? 's' : ''}
                          </p>
                        </div>

                        {hasEmployees && (
                          <>
                            <div className="relative mt-4">
                              <div className="h-8 w-0.5 bg-gray-300 mx-auto"></div>
                            </div>

                            <div className="flex flex-col gap-4 items-center mt-2">
                              {clientStructure.directEmployees.map(employee => {
                                const isSuperviseur = employee.position && employee.position.toLowerCase().includes('superviseur');
                                const bgColor = isSuperviseur ? 'bg-orange-600' : 'bg-gray-600';
                                const ringColor = isSuperviseur ? 'ring-orange-400' : 'ring-gray-400';

                                return (
                                  <div key={employee.id} className="flex flex-col items-center">
                                    <div
                                      className="flex flex-col items-center cursor-pointer group"
                                      onClick={handleItemClick(() => setSelectedItem({ type: 'employee', data: employee }))}
                                    >
                                      <div className={`w-12 h-12 md:w-14 md:h-14 rounded-full ${bgColor} flex items-center justify-center text-white text-sm md:text-base font-bold shadow-md group-hover:scale-110 transition-transform ring-2 ${ringColor}`}>
                                        {employee.photo_url ? (
                                          <img src={employee.photo_url} alt={employee.first_name} className="w-full h-full rounded-full object-cover" />
                                        ) : (
                                          `${employee.first_name[0]}${employee.last_name[0]}`
                                        )}
                                      </div>
                                      <p className="font-medium text-xs md:text-sm text-white mt-1 text-center">
                                        {employee.first_name} {employee.last_name}
                                      </p>
                                      <p className="text-xs text-gray-400 text-center">{employee.position}</p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {orgStructure.managers.length === 0 && orgStructure.manager_generals.length === 0 && !orgStructure.directeur_general && orgStructure.unassignedClients.length === 0 && (
            <div className="text-center py-8 md:py-12 bg-surface rounded-2xl shadow-sm">
              <p className="text-sm md:text-base text-gray-400">Aucune structure organisationnelle disponible</p>
            </div>
          )}
          </div>
        </div>
      )}

      {selectedItem && (
        <div className="fixed inset-0 bg-elevated bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-4 md:p-6 border-b border-gray-700 flex justify-between items-center sticky top-0 bg-surface rounded-t-2xl">
              <h2 className="text-xl md:text-2xl font-bold text-white">Détails</h2>
              <button onClick={() => setSelectedItem(null)} className="p-2 hover:bg-gray-700 rounded-xl transition-colors">
                <User className="text-white" size={20} />
              </button>
            </div>

            <div className="p-4 md:p-6">
              {selectedItem.type === 'admin' && (
                <div>
                  <div className="flex items-center gap-3 md:gap-4 mb-4">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center text-white text-xl md:text-2xl font-bold flex-shrink-0 bg-elevated">
                      {selectedItem.data.photo_url ? (
                        <img src={selectedItem.data.photo_url} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        `${selectedItem.data.first_name[0]}${selectedItem.data.last_name[0]}`
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-lg md:text-xl font-bold text-white truncate">
                        {selectedItem.data.first_name} {selectedItem.data.last_name}
                      </p>
                      <p className="text-gray-300 uppercase text-xs md:text-sm font-semibold">{selectedItem.data.role}</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm md:text-base text-white">
                    <p className="break-all"><span className="font-medium text-gray-300">Email:</span> {selectedItem.data.email}</p>
                    {selectedItem.data.phone && <p className="text-gray-300"><span className="font-medium">Téléphone:</span> {selectedItem.data.phone}</p>}
                  </div>
                </div>
              )}

              {selectedItem.type === 'manager' && (
                <div>
                  <div className="flex items-center gap-3 md:gap-4 mb-4">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center text-white text-xl md:text-2xl font-bold flex-shrink-0 bg-elevated">
                      {selectedItem.data.photo_url ? (
                        <img src={selectedItem.data.photo_url} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        `${selectedItem.data.first_name[0]}${selectedItem.data.last_name[0]}`
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-lg md:text-xl font-bold text-white truncate">
                        {selectedItem.data.first_name} {selectedItem.data.last_name}
                      </p>
                      <p className="text-gray-300 text-xs md:text-sm truncate">{selectedItem.data.position}</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedItem.type === 'client' && (
                <div>
                  <div className="flex items-center gap-3 md:gap-4 mb-4">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center text-white text-xl md:text-2xl font-bold flex-shrink-0 bg-blue-600">
                      {selectedItem.data.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-lg md:text-xl font-bold text-white truncate">
                        {selectedItem.data.name}
                      </p>
                      <p className="text-gray-300 text-sm">Client</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedItem.type === 'superviseur' && (
                <div>
                  <div className="flex items-center gap-3 md:gap-4 mb-4">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center text-white text-xl md:text-2xl font-bold flex-shrink-0 bg-purple-600">
                      {selectedItem.data.photo_url ? (
                        <img src={selectedItem.data.photo_url} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        `${selectedItem.data.first_name[0]}${selectedItem.data.last_name[0]}`
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-lg md:text-xl font-bold text-white truncate">
                        {selectedItem.data.first_name} {selectedItem.data.last_name}
                      </p>
                      <p className="text-gray-300 text-sm truncate">{selectedItem.data.position}</p>
                      {selectedItem.data.client_name && (
                        <p className="text-gray-400 text-xs truncate">Client: {selectedItem.data.client_name}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {selectedItem.type === 'employee' && (
                <div>
                  <div className="flex items-center gap-3 md:gap-4 mb-4">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center text-white text-xl md:text-2xl font-bold flex-shrink-0 bg-gray-600">
                      {selectedItem.data.photo_url ? (
                        <img src={selectedItem.data.photo_url} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        `${selectedItem.data.first_name[0]}${selectedItem.data.last_name[0]}`
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-lg md:text-xl font-bold text-white truncate">
                        {selectedItem.data.first_name} {selectedItem.data.last_name}
                      </p>
                      <p className="text-gray-300 text-sm truncate">{selectedItem.data.position}</p>
                      {selectedItem.data.client_name && (
                        <p className="text-gray-400 text-xs truncate">Client: {selectedItem.data.client_name}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 md:p-6 border-t border-gray-700">
              <button
                onClick={() => setSelectedItem(null)}
                className="w-full px-6 py-3 bg-elevated hover:bg-gray-700 text-white rounded-xl transition-colors font-medium"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
