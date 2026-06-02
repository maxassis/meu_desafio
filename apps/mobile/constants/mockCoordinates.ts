// Mock coordinates representing a route in São Paulo
export const mockDesafio = {
  id: 24,
  name: 'Desafio SP Capital',
  description: 'Percurso pela capital paulista',
  location: [
    // Parque Ibirapuera
    [-23.587192, -46.657244],
    [-23.586039, -46.656643],
    [-23.584892, -46.655935],
    [-23.583745, -46.655227],
    // Avenida Paulista
    [-23.565638, -46.654841],
    [-23.564491, -46.654133],
    [-23.563344, -46.653425],
    // Praça da República
    [-23.543344, -46.642425],
    [-23.542197, -46.641717],
    [-23.541050, -46.641009],
    // Pinacoteca
    [-23.534491, -46.633425],
    [-23.533344, -46.632717],
    [-23.532197, -46.632009],
    // Final no Parque da Luz
    [-23.531050, -46.631301],
  ],
  participation: [
    {
      user: {
        id: '1',
        name: 'João Silva',
        UserData: {
          avatar_url: 'https://avatars.githubusercontent.com/u/1234567',
        },
      },
      progress: 5.2,
    },
    {
      user: {
        id: '2',
        name: 'Maria Santos',
        UserData: {
          avatar_url: 'https://avatars.githubusercontent.com/u/7654321',
        },
      },
      progress: 3.8,
    },
    {
      user: {
        id: '3',
        name: 'Pedro Oliveira',
        UserData: {
          avatar_url: 'https://avatars.githubusercontent.com/u/9876543',
        },
      },
      progress: 7.1,
    },
  ],
}
