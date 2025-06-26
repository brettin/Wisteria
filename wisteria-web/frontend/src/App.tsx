import React, { useState, useEffect, useRef } from 'react';
import { apiService } from './services/api';
import { Session, Hypothesis, Model } from './types/hypothesis';

function App() {
  const [models, setModels] = useState<Model[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [currentHypothesis, setCurrentHypothesis] = useState<Hypothesis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Panel control state
  const [showCreateSessionPanel, setShowCreateSessionPanel] = useState(false);
  
  // Form states
  const [researchGoal, setResearchGoal] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [feedback, setFeedback] = useState('');
  // Ref to feedback textarea so we can scroll/focus it from header button
  const feedbackRef = useRef<HTMLTextAreaElement | null>(null);

  // Hypothesis navigation state
  const [hypothesisIndex, setHypothesisIndex] = useState(0);
  const [sessionHypotheses, setSessionHypotheses] = useState<Hypothesis[]>([]);

  // Image attachment state
  const [attachedImage, setAttachedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    console.log('App useEffect triggered - loading models and sessions');
    loadModels();
    loadSessions();
  }, []);

  const loadModels = async () => {
    const result = await apiService.getModels();
    if (result.data) {
      setModels(result.data);
    } else {
      setError(result.error || 'Failed to load models');
    }
  };

  const loadSessions = async () => {
    console.log('loadSessions called - about to call apiService.getSessions()');
    const result = await apiService.getSessions();
    console.log('loadSessions result:', result);
    if (result.data) {
      setSessions(result.data);
    } else {
      setError(result.error || 'Failed to load sessions');
    }
  };

  const createNewSession = async () => {
    if (!researchGoal.trim() || !selectedModel) {
      setError('Please provide a research goal and select a model');
      return;
    }

    setLoading(true);
    setError(null);

    const result = await apiService.createSession(researchGoal, selectedModel, apiKey);
    if (result.data) {
      setCurrentSession(result.data);
      setSessions([result.data, ...sessions]);
      // Clear hypothesis state for new session
      setCurrentHypothesis(null);
      setSessionHypotheses([]);
      setHypothesisIndex(0);

      // Generate first hypothesis immediately with comments/image if provided
      const commentsToSend = feedback.trim() || undefined;
      const hypothesisResult = await apiService.generateHypothesis(result.data.id, commentsToSend, attachedImage || undefined);
      
      if (hypothesisResult.data) {
        setCurrentHypothesis(hypothesisResult.data);
        setSessionHypotheses([hypothesisResult.data]);
        setHypothesisIndex(0);
        
        // Refresh session to get updated hypothesis count
        const sessionResult = await apiService.getSession(result.data.id);
        if (sessionResult.data) {
          updateSessionData(sessionResult.data);
          // Keep local hypothesis list in sync with backend
          if (sessionResult.data.hypotheses && sessionResult.data.hypotheses.length > 0) {
            setSessionHypotheses(sessionResult.data.hypotheses);
            setHypothesisIndex(sessionResult.data.hypotheses.length - 1);
          }
        }
        
        // Reload the entire sessions list to ensure the left panel shows updated info
        await loadSessions();
      }

      // Clear form data
      setResearchGoal('');
      setSelectedModel('');
      setApiKey('');
      setFeedback('');
      removeAttachedImage();
      
      // Switch back to hypothesis panel
      setShowCreateSessionPanel(false);
    } else {
      setError(result.error || 'Failed to create session');
    }
    setLoading(false);
  };

  // Helper function to update both current session and sessions array
  const updateSessionData = (updatedSession: Session) => {
    setCurrentSession(updatedSession);
    setSessions(sessions.map(session => 
      session.id === updatedSession.id ? updatedSession : session
    ));
  };

  const generateHypothesis = async () => {
    if (!currentSession) return;

    setLoading(true);
    setError(null);

    const commentsToSend = feedback.trim() || undefined;
    const result = await apiService.generateHypothesis(currentSession.id, commentsToSend, attachedImage || undefined);
    if (result.data) {
      setCurrentHypothesis(result.data);
      setFeedback('');
      // Initialize hypothesis list with the first generated hypothesis so that
      // navigation and feedback functionality work immediately.
      setSessionHypotheses([result.data]);
      setHypothesisIndex(0);
      // Switch back to hypothesis panel after generating first hypothesis
      setShowCreateSessionPanel(false);
      // Refresh session to get updated hypothesis count
      const sessionResult = await apiService.getSession(currentSession.id);
      if (sessionResult.data) {
        updateSessionData(sessionResult.data);
        // Keep local hypothesis list in sync with backend
        if (sessionResult.data.hypotheses && sessionResult.data.hypotheses.length > 0) {
          setSessionHypotheses(sessionResult.data.hypotheses);
          setHypothesisIndex(sessionResult.data.hypotheses.length - 1);
        }
      }
      
      // Reload sessions list to update hypothesis count in left panel
      await loadSessions();
      // Clear attached image after successful generation
      removeAttachedImage();
    } else {
      setError(result.error || 'Failed to generate hypothesis');
    }
    setLoading(false);
  };

  const improveHypothesis = async () => {
    if (!currentSession || !currentHypothesis || !feedback.trim()) return;

    setLoading(true);
    setError(null);

    const result = await apiService.improveHypothesis(currentSession.id, currentHypothesis.id, feedback, attachedImage || undefined);
    if (result.data) {
      setCurrentHypothesis(result.data);
      setFeedback('');
      // Refresh session
      const sessionResult = await apiService.getSession(currentSession.id);
      if (sessionResult.data) {
        updateSessionData(sessionResult.data);
        // Update local hypothesis list so navigation includes the improved version
        if (sessionResult.data.hypotheses && sessionResult.data.hypotheses.length > 0) {
          setSessionHypotheses(sessionResult.data.hypotheses);
          setHypothesisIndex(sessionResult.data.hypotheses.length - 1);
        }
      }
      
      // Reload sessions list to update hypothesis count in left panel
      await loadSessions();
      // Clear attached image after successful generation
      removeAttachedImage();
    } else {
      setError(result.error || 'Failed to improve hypothesis');
    }
    setLoading(false);
  };

  const generateNewHypothesis = async () => {
    if (!currentSession) return;

    setLoading(true);
    setError(null);

    const commentsToSend = feedback.trim() || undefined;
    const result = await apiService.generateNewHypothesis(currentSession.id, commentsToSend, attachedImage || undefined);
    if (result.data) {
      setCurrentHypothesis(result.data);
      setFeedback('');
      // Refresh session
      const sessionResult = await apiService.getSession(currentSession.id);
      if (sessionResult.data) {
        updateSessionData(sessionResult.data);
        // Sync local hypothesis list for navigation
        if (sessionResult.data.hypotheses && sessionResult.data.hypotheses.length > 0) {
          setSessionHypotheses(sessionResult.data.hypotheses);
          setHypothesisIndex(sessionResult.data.hypotheses.length - 1);
        }
      }
      
      // Reload sessions list to update hypothesis count in left panel
      await loadSessions();
      // Clear attached image after successful generation
      removeAttachedImage();
    } else {
      setError(result.error || 'Failed to generate new hypothesis');
    }
    setLoading(false);
  };

  const selectSession = async (session: Session) => {
    setCurrentSession(session);
    setCurrentHypothesis(null);
    setHypothesisIndex(0);
    // Switch to hypothesis panel when selecting a session
    setShowCreateSessionPanel(false);
    
    // Load session details with hypotheses
    const result = await apiService.getSession(session.id);
    if (result.data && result.data.hypotheses && result.data.hypotheses.length > 0) {
      const latestIndex = result.data.hypotheses.length - 1;
      setSessionHypotheses(result.data.hypotheses);
      setCurrentHypothesis(result.data.hypotheses[latestIndex]);
      setHypothesisIndex(latestIndex);
    } else {
      setSessionHypotheses([]);
    }
  };

  const deleteSession = async (sessionId: string) => {
    if (!window.confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    setError(null);

    const result = await apiService.deleteSession(sessionId);
    if (result.message) {
      // Remove from sessions list
      setSessions(sessions.filter(s => s.id !== sessionId));
      
      // If this was the current session, clear it
      if (currentSession?.id === sessionId) {
        setCurrentSession(null);
        setCurrentHypothesis(null);
        setSessionHypotheses([]);
        setHypothesisIndex(0);
      }
    } else {
      setError(result.error || 'Failed to delete session');
    }
    setLoading(false);
  };

  const downloadHypothesisPdf = async () => {
    if (!currentSession || !currentHypothesis) return;

    setLoading(true);
    setError(null);

    const result = await apiService.downloadHypothesisPdf(currentSession.id, currentHypothesis.id);
    if (result.error) {
      setError(result.error);
    }
    setLoading(false);
  };

  const navigateHypothesis = (direction: 'prev' | 'next') => {
    if (sessionHypotheses.length === 0) return;

    let newIndex = hypothesisIndex;
    if (direction === 'prev') {
      newIndex = Math.max(0, hypothesisIndex - 1);
    } else {
      newIndex = Math.min(sessionHypotheses.length - 1, hypothesisIndex + 1);
    }

    if (newIndex !== hypothesisIndex) {
      setHypothesisIndex(newIndex);
      setCurrentHypothesis(sessionHypotheses[newIndex]);
    }
  };

  const handleImageAttachment = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        setAttachedImage(file);
        
        // Create preview URL
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const removeAttachedImage = () => {
    setAttachedImage(null);
    setImagePreview(null);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <div className="container">
        <div className="header">
          <h1>Wisteria Research Hypothesis Generator</h1>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <div className="grid">
          {/* Left Panel - Sessions */}
          <div>
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ margin: 0 }}>Sessions</h2>
                <button
                  onClick={() => {
                    setShowCreateSessionPanel(true);
                    setCurrentSession(null);
                    setCurrentHypothesis(null);
                    setSessionHypotheses([]);
                    setHypothesisIndex(0);
                  }}
                  className="btn btn-primary btn-sm"
                >
                  Start New Session
                </button>
              </div>

              {/* Session List */}
              <div>
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className={`session-item ${currentSession?.id === session.id ? 'active' : ''}`}
                  >
                    <div 
                      className="session-content"
                      onClick={() => selectSession(session)}
                    >
                      <h4>{session.research_goal}</h4>
                      <p>{session.model_shortname}</p>
                      <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                        {new Date(session.created_at).toLocaleDateString()}
                      </p>
                      <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                        {session.hypothesis_count || 0} hypotheses
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSession(session.id);
                      }}
                      className="btn btn-danger btn-sm"
                      style={{ 
                        position: 'absolute', 
                        top: '0.5rem', 
                        right: '0.5rem',
                        fontSize: '0.75rem',
                        padding: '0.25rem 0.5rem'
                      }}
                      title="Delete session"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel - Create Session or Hypothesis Viewer */}
          <div>
            <div className="card">
              {showCreateSessionPanel ? (
                <div>
                  <h2>Create New Session</h2>
                  <div className="form-group">
                    <label>Research Goal</label>
                    <textarea
                      value={researchGoal}
                      onChange={(e) => setResearchGoal(e.target.value)}
                      placeholder="Enter your research goal..."
                      className="form-control"
                      style={{ height: '80px' }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Model</label>
                    <select
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      className="form-control"
                    >
                      <option value="">Select a model</option>
                      {models.map((model) => (
                        <option key={model.shortname} value={model.shortname}>
                          {model.shortname} ({model.model_name})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>API Key</label>
                    <input
                      type="text"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Enter your API key..."
                      className="form-control"
                    />
                  </div>
                  
                  {/* Additional Comments for first hypothesis */}
                  <div className="form-group">
                    <label>Additional Comments (for first hypothesis)</label>
                    <textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Enter any comments or context for the first hypothesis..."
                      className="form-control"
                      style={{ height: '80px' }}
                    />
                  </div>
                  
                  {/* Attach Image functionality */}
                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <label>Attach Image (optional)</label>
                      <button
                        onClick={handleImageAttachment}
                        className="btn btn-outline-secondary btn-sm"
                        type="button"
                      >
                        📎 Attach Image
                      </button>
                    </div>
                    
                    {/* Image Preview */}
                    {imagePreview && (
                      <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '0.375rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: '500' }}>Attached Image</h4>
                          <button
                            onClick={removeAttachedImage}
                            className="btn btn-outline-danger btn-sm"
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                          >
                            Remove
                          </button>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                          <img
                            src={imagePreview}
                            alt="Attached"
                            style={{
                              maxWidth: '100%',
                              maxHeight: '200px',
                              objectFit: 'contain',
                              border: '1px solid #e5e7eb',
                              borderRadius: '0.375rem'
                            }}
                          />
                        </div>
                        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: '#6b7280' }}>
                          {attachedImage?.name} ({((attachedImage?.size || 0) / 1024 / 1024).toFixed(2)} MB)
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                    <button
                      onClick={createNewSession}
                      disabled={loading || !researchGoal.trim() || !selectedModel}
                      className="btn btn-primary"
                    >
                      {loading ? 'Creating Session & Generating Hypothesis...' : 'Create Session & Generate Hypothesis'}
                    </button>
                    <button
                      onClick={() => setShowCreateSessionPanel(false)}
                      className="btn btn-outline-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : currentSession ? (
                <div>
                  <div className="hypothesis-header">
                    <h2>Session: {currentSession.research_goal}</h2>
                    <span className="text-gray-500">
                      Model: {currentSession.model_shortname}
                    </span>
                  </div>

                  {!currentHypothesis ? (
                    <div className="text-center p-8">
                      <p className="text-gray-500 mb-4">No hypothesis generated yet. Click "Start New Session" to create one.</p>
                    </div>
                  ) : (
                    <div>
                      {/* Hypothesis Navigation */}
                      {sessionHypotheses.length > 1 && (
                        <div className="hypothesis-navigation" style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          marginBottom: '1rem',
                          padding: '0.5rem',
                          backgroundColor: '#f8f9fa',
                          borderRadius: '0.375rem'
                        }}>
                          <button
                            onClick={() => navigateHypothesis('prev')}
                            disabled={hypothesisIndex === 0}
                            className="btn btn-outline-secondary btn-sm"
                          >
                            ← Previous
                          </button>
                          <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                            Hypothesis {hypothesisIndex + 1} of {sessionHypotheses.length}
                          </span>
                          <button
                            onClick={() => navigateHypothesis('next')}
                            disabled={hypothesisIndex === sessionHypotheses.length - 1}
                            className="btn btn-outline-secondary btn-sm"
                          >
                            Next →
                          </button>
                        </div>
                      )}

                      {/* Hypothesis Display */}
                      <div className="hypothesis">
                        <div className="hypothesis-header">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <div>
                              <h3 className="hypothesis-title">
                                Hypothesis #{currentHypothesis.hypothesis_number} v{currentHypothesis.version}
                              </h3>
                              <p className="hypothesis-meta">
                                Type: {currentHypothesis.hypothesis_type}
                              </p>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button
                                onClick={downloadHypothesisPdf}
                                disabled={loading}
                                className="btn btn-outline-primary btn-sm"
                                title="Download as PDF"
                              >
                                📄 PDF
                              </button>
                              <button
                                onClick={() => {
                                  if (feedbackRef.current) {
                                    feedbackRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    feedbackRef.current.focus();
                                  }
                                }}
                                className="btn btn-outline-secondary btn-sm"
                                title="Jump to feedback section"
                              >
                                💬 Provide Feedback
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        <div className="hypothesis-section">
                          <h4>Title</h4>
                          <p>{currentHypothesis.title}</p>
                        </div>

                        <div className="hypothesis-section">
                          <h4>Description</h4>
                          <p>{currentHypothesis.description}</p>
                        </div>

                        <div className="hypothesis-section">
                          <h4>Hallmarks Analysis</h4>
                          <div className="hallmarks-grid">
                            {Object.entries(currentHypothesis.hallmarks).map(([key, value]) => (
                              <div key={key} className="hallmark-item">
                                <h5>{key.replace('_', ' ')}:</h5>
                                <p>{value}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {currentHypothesis.references.length > 0 && (
                          <div className="hypothesis-section">
                            <h4>References</h4>
                            <div>
                              {currentHypothesis.references.map((refItem, index) => (
                                <div key={index} style={{ marginBottom: '0.5rem' }}>
                                  <p style={{ fontWeight: '500', fontSize: '0.875rem' }}>{refItem.citation}</p>
                                  <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>{refItem.annotation}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="border-t pt-4">
                        <div className="mb-4">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <h4>Provide Feedback</h4>
                            <button
                              onClick={handleImageAttachment}
                              className="btn btn-outline-secondary btn-sm"
                              title="Attach image"
                            >
                              📎 Attach Image
                            </button>
                          </div>
                          <textarea
                            ref={feedbackRef}
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            placeholder="Enter your feedback or comments..."
                            className="form-control"
                            style={{ height: '80px' }}
                          />
                          
                          {/* Image Preview */}
                          {imagePreview && (
                            <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '0.375rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <h5 style={{ margin: 0, fontSize: '0.875rem', fontWeight: '500' }}>Attached Image</h5>
                                <button
                                  onClick={removeAttachedImage}
                                  className="btn btn-outline-danger btn-sm"
                                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                                >
                                  Remove
                                </button>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'center' }}>
                                <img
                                  src={imagePreview}
                                  alt="Attached"
                                  style={{
                                    maxWidth: '100%',
                                    maxHeight: '200px',
                                    objectFit: 'contain',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '0.375rem'
                                  }}
                                />
                              </div>
                              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: '#6b7280' }}>
                                {attachedImage?.name} ({((attachedImage?.size || 0) / 1024 / 1024).toFixed(2)} MB)
                              </p>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex space-x-4">
                          <button
                            onClick={improveHypothesis}
                            disabled={loading || !feedback.trim()}
                            className="btn btn-warning"
                          >
                            {loading ? 'Improving...' : 'Improve Hypothesis'}
                          </button>
                          <button
                            onClick={generateNewHypothesis}
                            disabled={loading}
                            className="btn btn-danger"
                          >
                            {loading ? 'Generating...' : 'Generate New Hypothesis'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center p-8 text-gray-500">
                  Select a session to view hypotheses
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
