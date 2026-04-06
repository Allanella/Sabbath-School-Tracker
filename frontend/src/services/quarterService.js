import api from './api';

const quarterService = {
  getAll: () => api.get('/quarters'),
  
  getActive: () => api.get('/quarters/active'),
  
  getById: (id) => api.get(`/quarters/${id}`),
  
  create: (data) => api.post('/quarters', data),
  
  update: (id, data) => api.put(`/quarters/${id}`, data),
  
  delete: (id) => api.delete(`/quarters/${id}`),
  
  setActive: (id) => api.post('/quarters/set-active', { quarter_id: id }),
  
  copyFromPreviousQuarter: (sourceQuarterId, targetQuarterId) => 
    api.post('/quarters/copy', {
      source_quarter_id: sourceQuarterId,
      target_quarter_id: targetQuarterId
    })
};

export default quarterService;