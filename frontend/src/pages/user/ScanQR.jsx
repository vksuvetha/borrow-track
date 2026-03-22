import { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import AuthContext from '../../context/AuthContext';
import { Html5Qrcode } from 'html5-qrcode';
import { Scan, Package, Calendar, RefreshCw, CheckCircle, AlertCircle, ArrowLeft, Camera, ShieldAlert } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const ScanQR = () => {
  const [scanResult, setScanResult] = useState('');
  const [item, setItem] = useState(null);
  const [loadingItem, setLoadingItem] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [returnDate, setReturnDate] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [cameraError, setCameraError] = useState(false);
  const [manualId, setManualId] = useState('');
  const [cameras, setCameras] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [activeCameraId, setActiveCameraId] = useState('');
  
  const html5QrCode = useRef(null);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const qrIdFromUrl = searchParams.get('qrId');

  // Helper to extract qrId from potential full URL
  const extractQrId = (text) => {
    if (!text || typeof text !== 'string') return text;
    console.log("Decoding QR Text:", text);
    try {
      // If it looks like a URL, extract qrId
      if (text.toLowerCase().startsWith('http')) {
        const url = new URL(text);
        const id = url.searchParams.get('qrId');
        
        // If qrId param exists, return it
        if (id) return id;
        
        // Fallback: if it's a URL but no qrId param, maybe it's just the ID at the end of the path?
        const pathParts = url.pathname.split('/');
        return pathParts[pathParts.length - 1];
      }
      return text;
    } catch (e) {
      console.warn("URL Parse Fail, using raw text", e);
      return text;
    }
  };

  useEffect(() => {
    if (qrIdFromUrl) {
        setScanResult(qrIdFromUrl);
    }

    // Initialize low-level controller
    html5QrCode.current = new Html5Qrcode("reader");

    // Fetch available cameras immediately
    getCameras();

    return () => {
      if (html5QrCode.current && isScanning) {
        html5QrCode.current.stop().catch(err => console.error("Stop error", err));
      }
    };
  }, []);

  const getCameras = async () => {
    try {
      const devices = await Html5Qrcode.getCameras();
      console.log("Found Cameras:", devices);
      if (devices && devices.length > 0) {
        setCameras(devices);
        setActiveCameraId(devices[0].id);
        setCameraError(false);
      }
    } catch (err) {
      console.warn("Silent camera fetch failure (expected on some browsers):", err);
      // Don't set cameraError here to avoid scaring the user on page load
    }
  };

  const startScanning = async () => {
    if (!html5QrCode.current) return;
    
    // Fallback: If no cameraId is selected yet, try to get cameras again
    if (!activeCameraId && cameras.length === 0) {
      await getCameras();
    }
    const targetId = activeCameraId || (cameras[0]?.id);
    const qrConfig = { fps: 10, qrbox: { width: 250, height: 250 } };

    if (!targetId) {
       setCameraError(true);
       return;
    }

    setCameraError(false);
    setIsScanning(true);
    setMessage({ type: '', text: '' });

    try {
      console.log("Starting scanner with camera ID:", targetId);
      await html5QrCode.current.start(
        targetId,
        qrConfig,
        onScanSuccess,
        () => {} // silence noise
      );
      console.log("Scanner started successfully.");
    } catch (err) {
      console.error("Camera Hardware Error:", err);
      setIsScanning(false);
      setCameraError(true);
      
      const errName = err.name || "";
      if (errName === 'NotReadableError' || errName === 'TrackStartError') {
        setMessage({ type: 'error', text: 'Camera is already in use by another app (like Zoom). Or Windows Privacy Settings block access.' });
      } else if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
        setMessage({ type: 'error', text: 'Camera permission was denied. Please check your browser or OS settings.' });
      } else if (errName === 'NotFoundError' || err.message?.includes('Requested device not found')) {
        setMessage({ type: 'error', text: 'No camera hardware found! Your laptop might not have a webcam, or it is disabled by a physical switch or keyboard shortcut (e.g. Fn+F8, Fn+CameraKey).' });
      } else {
        setMessage({ type: 'error', text: `Camera Error: ${err.message || err}. Try using the "CHOOSE QR IMAGE" fallback.` });
      }
    }
  };

  const stopScanning = async () => {
    if (html5QrCode.current && isScanning) {
      try {
        await html5QrCode.current.stop();
        setIsScanning(false);
      } catch (err) {
        console.error("Stop error", err);
      }
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !html5QrCode.current) return;

    setMessage({ type: '', text: '' });
    try {
      const decodedText = await html5QrCode.current.scanFile(file, true);
      onScanSuccess(decodedText);
    } catch (err) {
      console.error("File scan error", err);
      setMessage({ type: 'error', text: 'Could not find a valid QR code in that image.' });
    }
  };

  useEffect(() => {
    if (scanResult) {
      console.log("Fetching details for:", scanResult);
      fetchItemDetails(extractQrId(scanResult));
    }
  }, [scanResult]);

  function onScanSuccess(decodedText) {
    stopScanning();
    setScanResult(decodedText);
    setMessage({ type: '', text: '' });
  }

  function onScanFailure(error) {
    // Silence normal scanning noise
    if (error?.includes('No MultiFormat Readers') || error?.includes('No QR code found')) {
      return;
    }

    const errorStr = typeof error === 'string' ? error : (error?.message || JSON.stringify(error));
    if (errorStr && (errorStr.includes('Requested device not found') || errorStr.includes('NotFoundError') || errorStr.includes('Permission denied'))) {
      console.warn("Scanner Error:", errorStr);
      setCameraError(true);
    }
  }

  const fetchItemDetails = async (qrCodeId) => {
    setLoadingItem(true);
    setItem(null);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const finalQrId = extractQrId(qrCodeId);
      console.log(`FETCHING ITEM: /api/items/qr/${finalQrId}`);
      const { data } = await axios.get(`/api/items/qr/${finalQrId}`, config);
      setItem(data);
      
      // Set default return date to 7 days from now
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 7);
      setReturnDate(defaultDate.toISOString().split('T')[0]);
    } catch (error) {
      console.error("Fetch Error:", error);
      setMessage({ type: 'error', text: error.response?.data?.message || 'Item not found in the system. Invalid QR Code.' });
      resetScanner();
    } finally {
      setLoadingItem(false);
    }
  };

  const resetScanner = () => {
    setScanResult('');
    setItem(null);
    stopScanning();
    setMessage({ type: '', text: '' });
  };

  const handleBorrow = async () => {
    const selectedDate = new Date(returnDate);
    const today = new Date();
    today.setHours(0,0,0,0);
    const maxDate = new Date();
    maxDate.setDate(today.getDate() + 7);
    maxDate.setHours(23,59,59,999);

    if (selectedDate > maxDate) {
        setMessage({ type: 'error', text: 'Maximum borrow period is 1 week (7 days).' });
        return;
    }
    if (selectedDate < today) {
        setMessage({ type: 'error', text: 'Please select a future date.' });
        return;
    }

    setActionLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.post(`/api/borrow/${item.qrCodeId}`, { expectedReturnDate: returnDate }, config);
      setMessage({ type: 'success', text: `Successfully borrowed ${item.name}!` });
      setTimeout(() => navigate('/my-history'), 2000);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to borrow item.' });
      setActionLoading(false);
    }
  };

  const handleReturn = async () => {
    setActionLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.put(`/api/borrow/return/${item.qrCodeId}`, {}, config);
      setMessage({ type: 'success', text: `Successfully returned ${item.name}!` });
      setTimeout(() => navigate('/my-history'), 2000);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to return item.' });
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
            <Scan className="text-indigo-600" size={32} /> 
            Smart Scanner
          </h2>
          <p className="text-gray-500 mt-1">Scan QR codes to borrow or return shared items instantly.</p>
        </div>
        <button 
           onClick={() => navigate('/')}
           className="hidden md:flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium transition"
        >
           <ArrowLeft size={20} /> Back to Dashboard
        </button>
      </div>

      {/* SECURE CONTEXT DIAGNOSTIC */}
      {!window.isSecureContext && (
         <div className="mb-6 p-4 bg-red-100 border border-red-200 rounded-2xl flex items-start gap-3 text-red-900 shadow-sm animate-pulse">
            <AlertCircle className="mt-1 flex-shrink-0" size={24} />
            <div className="text-left">
               <p className="font-black text-xs uppercase tracking-widest mb-1">Insecure Connection Detected</p>
               <p className="text-sm font-bold mb-2">The browser has BLOCKED your camera because you are using an IP address instead of 'localhost' or 'https'.</p>
               <div className="bg-white/50 p-3 rounded-lg text-[10px] font-mono leading-tight">
                  <p className="mb-2 font-bold uppercase text-red-600 underline">FIX IN CHROME (Desktop/Android):</p>
                  <ol className="list-decimal pl-4 space-y-1">
                     <li>Visit: <span className="p-0.5 bg-red-200">chrome://flags/#unsafely-treat-insecure-origin-as-secure</span></li>
                     <li>Enable the flag and add your IP (e.g. <span className="p-0.5 bg-red-200">http://{window.location.host}</span>)</li>
                     <li>Relaunch Chrome.</li>
                  </ol>
               </div>
            </div>
         </div>
      )}

      {message.text && (
        <div className={`p-4 mb-8 rounded-xl shadow-sm border-l-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border-green-500' 
            : 'bg-red-50 text-red-800 border-red-500'
        }`}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Scanner Side */}
        <div className="lg:col-span-5 text-left">
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 overflow-hidden sticky top-6">
            <div className="bg-gradient-to-r from-indigo-600/90 to-violet-700/90 p-5 text-white text-left">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Scan size={20} /> Interactive Scanner
              </h3>
            </div>
            
            <div className="p-6 flex flex-col items-center">
              <div id="reader" className={`w-full rounded-xl overflow-hidden shadow-inner bg-black ${isScanning ? 'block' : 'hidden'} mb-4 aspect-square`}>
              </div>

              {!isScanning && !scanResult && (
                <div className="w-full flex flex-col items-center justify-center p-10 bg-gray-50 rounded-xl mb-6 border-2 border-dashed border-gray-200">
                    <Camera className="text-gray-300 mb-4" size={48} />
                    <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">
                       {cameras.length > 0 ? 'Ready to Scan' : 'Searching for Camera...'}
                    </p>
                </div>
              )}

              {cameras.length > 0 && !isScanning && !scanResult && (
                <div className="w-full mb-6">
                   <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Select Camera</label>
                   <select 
                     className="w-full p-3 bg-white border rounded-xl font-bold text-sm text-gray-700"
                     value={activeCameraId}
                     onChange={(e) => setActiveCameraId(e.target.value)}
                   >
                     {cameras.map(cam => (
                       <option key={cam.id} value={cam.id}>{cam.label || `Camera ${cameras.indexOf(cam) + 1}`}</option>
                     ))}
                   </select>
                </div>
              )}

              {!scanResult && (
                <div className="w-full space-y-4">
                  {!isScanning ? (
                    <button 
                      onClick={startScanning}
                      className="w-full flex items-center justify-center gap-2 py-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-black shadow-lg"
                    >
                      <Camera size={20} /> START CAMERA
                    </button>
                  ) : (
                    <button 
                      onClick={stopScanning}
                      className="w-full flex items-center justify-center gap-2 py-4 bg-red-600 text-white rounded-xl hover:bg-red-700 transition font-black shadow-lg"
                    >
                      <RefreshCw size={20} className="animate-spin" /> STOP SCANNING
                    </button>
                  )
                  }

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white/80 backdrop-blur-md px-2 text-gray-400 font-bold">OR UPLOAD</span>
                    </div>
                  </div>

                  <label className="w-full flex items-center justify-center gap-2 py-4 bg-white border-2 border-indigo-100 text-indigo-700 rounded-xl hover:bg-indigo-50 transition font-black cursor-pointer">
                    <Package size={20} /> CHOOSE QR IMAGE
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleFileUpload} 
                    />
                  </label>
                </div>
              )}
                
              {cameraError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mt-6 text-sm text-red-800">
                  <p className="font-bold flex items-center gap-2 mb-1 uppercase text-[10px] tracking-wide">
                    <ShieldAlert size={14} /> Camera Blocked
                  </p>
                  <p className="text-[10px] opacity-90 leading-tight mb-3">
                    Your browser or system is blocking the camera.
                  </p>
                  <ul className="text-[9px] list-disc pl-4 space-y-1 font-medium italic text-red-700">
                    {!window.isSecureContext && <li><b>CRITICAL:</b> Browser blocks camera on HTTP connections. Use 'localhost' or HTTPS.</li>}
                    <li>Check if your laptop camera slide is closed.</li>
                    <li>Ensure you gave permission in the URL bar (lock icon).</li>
                  </ul>
                </div>
              )}
              
              {scanResult && (
                <button 
                  onClick={resetScanner}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-50 text-indigo-700 rounded-xl hover:bg-indigo-100 transition font-bold mb-4"
                >
                  <RefreshCw size={18} /> Rescan / Reset
                </button>
              )}

              <p className="text-[10px] text-center text-gray-400 uppercase tracking-widest font-bold mt-2">
                Scan with camera or upload QR image
              </p>

              <div className="mt-8 pt-6 border-t border-gray-100 w-full">
                 <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Debug Tools: Manual ID</label>
                 <div className="flex gap-2">
                   <input 
                     type="text" 
                     className="flex-1 px-3 py-2 border rounded-lg text-xs font-mono focus:ring-1 focus:ring-indigo-500"
                     placeholder="Enter UUID..."
                     value={manualId}
                     onChange={(e) => setManualId(e.target.value)}
                   />
                   <button 
                     onClick={() => { if(manualId) setScanResult(manualId); }}
                     className="px-3 py-2 bg-gray-800 text-white text-xs font-bold rounded-lg hover:bg-black transition whitespace-nowrap"
                   >
                     Verify
                   </button>
                 </div>
              </div>
            </div>
          </div>
        </div>

        {/* Item Details Side */}
        <div className="lg:col-span-7 text-left">
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 overflow-hidden min-h-[500px] flex flex-col">
            <div className="bg-gray-50/50 p-5 border-b border-gray-100 text-left">
               <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                 <Package size={20} className="text-indigo-600" /> Item Details
               </h3>
            </div>
            
            <div className="p-8 flex-1 flex flex-col">
              {loadingItem ? (
                <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                  <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-indigo-600 font-bold tracking-wide animate-pulse uppercase text-xs">Fetching Data...</p>
                </div>
              ) : !item ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-300 text-center animate-pulse py-10">
                  <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                    <Scan size={48} />
                  </div>
                  <p className="text-lg font-semibold text-gray-400">Scan an item to begin</p>
                  <p className="text-xs">The details will load here automatically.</p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col animate-in fade-in zoom-in-95 duration-500 text-left">
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                       <span className={`px-4 py-1.5 text-xs font-black uppercase tracking-[0.1em] rounded-full shadow-sm ${
                         item.status === 'Available' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                       }`}>
                         {item.status}
                       </span>
                       <span className="text-[10px] font-bold text-gray-400 tracking-tighter uppercase">ID: {item.qrCodeId}</span>
                    </div>

                    <h4 className="text-4xl font-black text-gray-900 leading-tight mb-4 tracking-tight uppercase">
                      {item.name}
                    </h4>
                    
                    <p className="text-gray-600 text-lg leading-relaxed font-medium">
                      {item.description}
                    </p>
                  </div>
                  
                  <div className="mt-auto space-y-6">
                    {item.status === 'Available' ? (
                      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-4 text-indigo-900 font-bold text-sm uppercase">
                           <Calendar size={18} /> Return Date
                        </div>
                        <input 
                          type="date"
                          className="w-full px-4 py-3 bg-white border border-indigo-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:outline-none text-gray-800 font-bold text-lg shadow-sm"
                          value={returnDate}
                          onChange={(e) => setReturnDate(e.target.value)}
                        />
                      </div>
                    ) : (
                      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 text-center">
                        {item.nextAvailableDate ? (
                           <>
                             <p className="text-amber-900 text-sm font-bold uppercase tracking-wide mb-1">Expected back on</p>
                             <p className="text-amber-700 text-3xl font-black tracking-tighter">
                                {new Date(item.nextAvailableDate).toLocaleDateString()}
                             </p>
                           </>
                        ) : (
                          <p className="text-amber-800 font-bold">Currently borrowed.</p>
                        )}
                      </div>
                    )}

                    <div className="pt-4">
                      {item.status === 'Available' ? (
                        <button
                          onClick={handleBorrow}
                          disabled={actionLoading}
                          className="w-full flex justify-center items-center gap-3 py-5 px-6 rounded-2xl shadow-xl text-lg font-black text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition group disabled:opacity-50"
                        >
                          {actionLoading ? 'BORROWING...' : 'CONFIRM BORROW'}
                        </button>
                      ) : (
                        user?.isAdmin ? (
                          <button
                            onClick={handleReturn}
                            disabled={actionLoading}
                            className="w-full flex justify-center items-center gap-3 py-5 px-6 rounded-2xl shadow-xl text-lg font-black text-indigo-700 bg-indigo-50 hover:bg-indigo-100 active:scale-[0.98] transition group disabled:opacity-50"
                          >
                            {actionLoading ? 'RETURNING...' : 'CONFIRM RETURN'}
                          </button>
                        ) : (
                          <div className="bg-amber-100/80 backdrop-blur-sm border border-amber-200 rounded-2xl p-6 text-center shadow-lg">
                             <div className="flex flex-col items-center">
                                <AlertCircle className="text-amber-600 mb-2" size={32} />
                                <p className="text-amber-900 font-black uppercase text-xs tracking-widest mb-1">Restricted Action</p>
                                <p className="text-amber-800 font-bold text-sm">Please return this item to the Administrator to process the return.</p>
                             </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        #reader { border: none !important; border-radius: 12px; }
        #reader__dashboard_section_csr button {
          background-color: #4f46e5;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 12px;
          font-weight: 700;
          cursor: pointer;
          margin-top: 15px;
        }
        #reader__dashboard_section_swaplink { 
          text-decoration: none; 
          color: #4f46e5; 
          margin-top: 15px; 
          display: block; 
          font-weight: 700;
        }
      `}</style>
    </div>
  );
};

export default ScanQR;
