import React, { useState, useEffect, useRef } from 'react';
import { productsAPI, gesturesAPI, tryonAPI } from '../services/api';

const TryOn = () => {
    const [selectedUpper, setSelectedUpper] = useState(null); // Shirt/Top
    const [selectedLower, setSelectedLower] = useState(null); // Pant/Bottom
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('all');
    const [currentProductIndex, setCurrentProductIndex] = useState(0);

    // Reset index when category changes
    useEffect(() => {
        setCurrentProductIndex(0);
    }, [activeCategory]);

    // Camera state - Default to true for Backend Stream
    const [cameraActive, setCameraActive] = useState(true);
    const [cameraError, setCameraError] = useState('');
    const videoRef = useRef(null);
    const streamRef = useRef(null);

    // Tutorial and Scanning states
    const [showTutorial, setShowTutorial] = useState(true); // Always show on mount/refresh
    const [isScanning, setIsScanning] = useState(false);
    const [scanProgress, setScanProgress] = useState(0); // 0-100%
    const [scanComplete, setScanComplete] = useState(false);

    // Gesture Control State - Default to true
    const [gestureMode, setGestureMode] = useState(true);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [isClicked, setIsClicked] = useState(false);

    // Try-On Integration States
    const [personImages, setPersonImages] = useState({
        front: null,
        back: null,
        left: null,
        right: null
    });
    const [captureStep, setCaptureStep] = useState('OFF'); // OFF, FRONT, BACK, LEFT, RIGHT, COMPLETED
    const [isManualMode, setIsManualMode] = useState(false);
    const [analysis, setAnalysis] = useState({ status: 'waiting', feedback: 'Initializing...' });
    const [countdown, setCountdown] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [tryOnResult, setTryOnResult] = useState(null); 
    const [error, setError] = useState(null);
    const [lastSpoken, setLastSpoken] = useState('');
    const [narratorMessage, setNarratorMessage] = useState('');
    const [isAutomatedFlow, setIsAutomatedFlow] = useState(false);
    const [longWaitMessage, setLongWaitMessage] = useState(false);
    const [generationTime, setGenerationTime] = useState(0);
    const [isProcessingCapture, setIsProcessingCapture] = useState(false);
    const countdownTimerRef = useRef(null);



    // Fetch products on mount
    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await productsAPI.getAll();
            if (response.success) {
                setProducts(response.data);
            }
        } catch (err) {
            console.error('Failed to load products:', err);
        } finally {
            setLoading(false);
        }
    };

    // Listen for commands from the Dashboard
    useEffect(() => {
        const channel = new BroadcastChannel('virtual-fit-app');
        channel.onmessage = (event) => {
            if (event.data.type === 'SELECT_ITEM') {
                handleProductSelect(event.data.payload);
            } else if (event.data.type === 'CLOSE_SCREEN') {
                window.close();
            }
        };

        const handleUnload = () => {
            // Send multiple messages to ensure the Dashboard catches it
            channel.postMessage({ type: 'SCREEN_CLOSED' });
            channel.postMessage({ type: 'SCREEN_CLOSED' });
        };
        window.addEventListener('unload', handleUnload);

        return () => {
            handleUnload();
            channel.close();
            window.removeEventListener('unload', handleUnload);
        };
    }, []);

    // Prevent Back Navigation
    useEffect(() => {
        window.history.pushState(null, null, window.location.href);
        const handlePopState = () => {
            window.history.pushState(null, null, window.location.href);
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    // Simplified Camera Management - Handled by Backend
    useEffect(() => {
        // If the view mounts, we assume the backend is already started by the Dashboard
        setCameraActive(true);
        setGestureMode(true);
    }, []);

    // Cleanup camera and gestures on unmount
    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            // Ensure gestures are stopped when leaving page
            gesturesAPI.stop().catch(console.error);
        };
    }, []);

    // Polling Analysis for Guided Capture (Only if NOT in automated flow / manual)
    useEffect(() => {
        let isActive = true;
        
        const poll = async () => {
            if (!isActive || captureStep === 'OFF' || captureStep === 'COMPLETED' || isManualMode || isAutomatedFlow || personImages[captureStep.toLowerCase()]) return;
            
            try {
                const res = await tryonAPI.analyze(captureStep, { 
                    upper: !!selectedUpper, 
                    lower: !!selectedLower 
                });
                
                if (!isActive) return;

                if (res.success) {
                    setAnalysis(res.analysis);
                    
                    const speechText = res.analysis.narrator || res.analysis.feedback;
                    if (speechText && speechText !== lastSpoken) {
                        speakText(speechText);
                        setLastSpoken(speechText);
                    }

                    if (res.analysis.status === 'ready' && countdown === null) {
                        startCaptureCountdown();
                    } else if (res.analysis.status !== 'ready') {
                        setCountdown(null);
                    }
                }
            } catch (err) {
                console.error('Analysis failed:', err);
            } finally {
                if (isActive) setTimeout(poll, 800); // 800ms gap between calls
            }
        };

        if (captureStep !== 'OFF' && captureStep !== 'COMPLETED' && !isManualMode && !isAutomatedFlow) {
            poll();
        }

        return () => { isActive = false; };
    }, [captureStep, isManualMode, isAutomatedFlow]);

    // Generation Timer Effect
    useEffect(() => {
        let timer;
        if (isGenerating) {
            setGenerationTime(0);
            timer = setInterval(() => {
                setGenerationTime(prev => prev + 1);
            }, 1000);
        } else {
            setGenerationTime(0);
            clearInterval(timer);
        }
        return () => clearInterval(timer);
    }, [isGenerating]);


    // Monitoring Long Wait Threshold
    useEffect(() => {
        let timer;
        if (isGenerating) {
            timer = setTimeout(() => {
                setLongWaitMessage(true);
            }, 25000); // 25 seconds before showing warning
        } else {
            setLongWaitMessage(false);
        }
        return () => clearTimeout(timer);
    }, [isGenerating]);

    const speakText = (text) => {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel(); // Stop current speech
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
    };

    const startCaptureCountdown = (seconds = 7, targetStep = null) => {
        // Clear any existing timer to prevent "rushing" or multiple captures
        if (countdownTimerRef.current) {
            clearInterval(countdownTimerRef.current);
        }
        
        setCountdown(seconds);
        const stepToCapture = targetStep || captureStep;
        
        countdownTimerRef.current = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(countdownTimerRef.current);
                    countdownTimerRef.current = null;
                    performCapture(stepToCapture);
                    return null;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const performCapture = async (step = null) => {
        if (isProcessingCapture) return;
        
        const targetStep = step || captureStep;
        if (!targetStep || targetStep === 'OFF' || targetStep === 'COMPLETED') return;

        try {
            setIsProcessingCapture(true);
            const res = await tryonAPI.capture();
            if (res.success) {
                const stepLower = targetStep.toLowerCase();
                setPersonImages(prev => ({ ...prev, [stepLower]: res.image_b64 }));
                
                const steps = ['FRONT', 'LEFT', 'BACK', 'RIGHT'];
                const currentIndex = steps.indexOf(targetStep);
                const nextStep = steps[currentIndex + 1];
                
                // We no longer auto-advance. We stay on the current step but mark as captured.
                const transitionMsg = `Capture complete for your ${targetStep} view. ${nextStep ? `You can now proceed to ${nextStep} or recapture this angle.` : "All angles ready!"}`;
                speakText(transitionMsg);
                setNarratorMessage(transitionMsg);
                setIsAutomatedFlow(false); 
                
                // If it was the final step, we can mark as "COMPLETED" globally if we want, 
                // but better to just keep the dashboard active.
                if (targetStep === 'FRONT' && (selectedUpper || selectedLower)) {
                    // Auto-trigger if front is captured and clothes selected
                    // but we'll wait 2s for user to see the thumbnail
                    setTimeout(() => handleVirtualTryOn(), 2000);
                }
            }
        } catch (err) {
            setError('Capture failed');
            setIsAutomatedFlow(false);
        } finally {
            setIsProcessingCapture(false);
        }
    };

    const handleManualUpload = (angle, e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPersonImages(prev => ({ ...prev, [angle]: reader.result.split(',')[1] }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleStartCapture = async (step = 'FRONT') => {
        try {
            // Stop any existing countdown
            if (countdownTimerRef.current) {
                clearInterval(countdownTimerRef.current);
                countdownTimerRef.current = null;
            }

            if (cameraActive && !gestureMode) {
                await gesturesAPI.start();
            }
            setIsAutomatedFlow(true);
            setCaptureStep(step);
            const introMsg = `Preparing for ${step} view. You have 7 seconds to position yourself.`;
            
            speakText(introMsg);
            setNarratorMessage(introMsg);
            startCaptureCountdown(7, step);
        } catch (err) {
            console.error('Failed to start gesture engine:', err);
            setError('Could not start camera. Please ensure it is not used by another app.');
            setIsAutomatedFlow(false);
        }
    };

    const handleResetSession = () => {
        setPersonImages({ front: null, back: null, left: null, right: null });
        setCaptureStep('OFF');
        setScanComplete(false);
        setNarratorMessage('');
        setError(null);
        speakText("Studio session reset. Ready for a new capture.");
    };

    // Handle ESC key to close tutorial
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && showTutorial) {
                handleTutorialComplete();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showTutorial]);


    // Integrated scan completion handler
    const handleTutorialComplete = async () => {
        setShowTutorial(false);
    };


    const getProductImage = (product) => {
        if (product?.image_url) return product.image_url;
        if (!product) return '';
        const colors = ['6366F1', '14B8A6', 'F59E0B', '64748B', 'EC4899', '8B5CF6'];
        const color = colors[product.id % colors.length];
        return `https://via.placeholder.com/150/${color}/FFFFFF?text=${encodeURIComponent(product.name?.charAt(0) || '?')}`;
    };

    // Determine if product is upper or lower body
    const isUpperBody = (product) => {
        const upperTypes = ['upper', 'top', 'shirt', 'tshirt', 't-shirt'];
        const upperCategories = ['T-Shirts', 'Shirts', 'Outerwear', 'Tops', 'Jackets'];
        return upperTypes.includes(product.clothing_type?.toLowerCase()) ||
            upperCategories.some(cat => product.category?.includes(cat));
    };

    const isLowerBody = (product) => {
        const lowerTypes = ['lower', 'bottom', 'pant', 'pants'];
        const lowerCategories = ['Pants', 'Jeans', 'Shorts', 'Trousers', 'Bottoms'];
        return lowerTypes.includes(product.clothing_type?.toLowerCase()) ||
            lowerCategories.some(cat => product.category?.includes(cat));
    };

    // Handle product selection
    const handleProductSelect = (product) => {
        if (isLowerBody(product)) {
            setSelectedLower(product);
        } else {
            setSelectedUpper(product);
        }
    };

    // Trigger Virtual Try On
    const handleVirtualTryOn = async () => {
        if (!personImages.front || (!selectedUpper && !selectedLower)) return;
        
        try {
            setIsGenerating(true);
            setError(null);
            
            const garment = selectedUpper || selectedLower;
            const garmentImage = getProductImage(garment);

            // We use the 'front' image as primary for now as most models 
            // only handle single view, but we've stored all 4 for future 360 logic.
            const response = await tryonAPI.generate(personImages.front, garmentImage);
            if (response.success) {
                setTryOnResult(response.result_url);
            } else {
                setError(response.error || 'Failed to generate try-on');
            }
        } catch (err) {
            console.error('Try-on failed:', err);
            setError(err.message || 'An unexpected error occurred during try-on');
        } finally {
            setIsGenerating(false);
        }
    };

    // Filter products
    const filteredProducts = products.filter(product => {
        // Category filter
        if (activeCategory === 'upper' && !isUpperBody(product)) return false;
        if (activeCategory === 'lower' && !isLowerBody(product)) return false;
        return true;
    });

    const currentProduct = filteredProducts[currentProductIndex];

    const nextProduct = () => {
        setCurrentProductIndex(prev =>
            prev < filteredProducts.length - 1 ? prev + 1 : 0
        );
    };

    const prevProduct = () => {
        setCurrentProductIndex(prev =>
            prev > 0 ? prev - 1 : filteredProducts.length - 1
        );
    };

    // Category counts
    const upperCount = products.filter(isUpperBody).length;
    const lowerCount = products.filter(isLowerBody).length;

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden font-sans">

            {/* ==================== TUTORIAL MODAL ==================== */}
            {showTutorial && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Backdrop with blur - Made transparent for gesture visibility */}
                    <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"></div>

                    {/* Ambient glow effects */}
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[150px]"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-600/15 rounded-full blur-[120px]"></div>

                    {/* Modal Content */}
                    <div className="relative z-10 w-full max-w-3xl mx-8">

                        {/* Header Section */}
                        <div className="text-center mb-12">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6">
                                <span className="material-symbols-outlined text-indigo-400 text-sm">info</span>
                                <span className="text-sm text-white/70 tracking-wide">Before you begin</span>
                            </div>
                            <h1 className="text-5xl font-light text-white tracking-tight mb-4">
                                Gesture <span className="font-semibold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">Controls</span>
                            </h1>
                            <p className="text-lg text-white/50 max-w-md mx-auto leading-relaxed">
                                Navigate the virtual try-on experience using simple hand movements
                            </p>
                        </div>

                        {/* Gesture Cards Grid */}
                        <div className="grid grid-cols-3 gap-6 mb-12">

                            {/* Card 1 - Movement */}
                            <div className="group relative p-6 rounded-3xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all duration-300 hover:bg-white/[0.05]">
                                <div className="absolute -top-3 -left-3 size-8 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center">
                                    <span className="text-sm font-semibold text-white/80">1</span>
                                </div>
                                <div className="size-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                    <span className="material-symbols-outlined text-emerald-400 text-3xl">pan_tool_alt</span>
                                </div>
                                <h3 className="text-center font-medium text-white mb-2">Move Pointer</h3>
                                <p className="text-center text-sm text-white/40 leading-relaxed">
                                    Raise your <span className="text-emerald-400">Index Finger</span> to move the cursor
                                </p>
                            </div>

                            {/* Card 2 - Stop/Pause */}
                            <div className="group relative p-6 rounded-3xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all duration-300 hover:bg-white/[0.05]">
                                <div className="absolute -top-3 -left-3 size-8 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center">
                                    <span className="text-sm font-semibold text-white/80">2</span>
                                </div>
                                <div className="size-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                    <span className="material-symbols-outlined text-amber-400 text-3xl">pan_tool</span>
                                </div>
                                <h3 className="text-center font-medium text-white mb-2">Stop Cursor</h3>
                                <p className="text-center text-sm text-white/40 leading-relaxed">
                                    Show <span className="text-amber-400">Two Fingers</span> (Index + Middle) to stop movement
                                </p>
                            </div>

                            {/* Card 3 - Click/Select */}
                            <div className="group relative p-6 rounded-3xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all duration-300 hover:bg-white/[0.05]">
                                <div className="absolute -top-3 -left-3 size-8 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center">
                                    <span className="text-sm font-semibold text-white/80">3</span>
                                </div>
                                <div className="size-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                    <span className="material-symbols-outlined text-blue-400 text-3xl">ads_click</span>
                                </div>
                                <h3 className="text-center font-medium text-white mb-2">Select Item</h3>
                                <p className="text-center text-sm text-white/40 leading-relaxed">
                                    <span className="text-blue-400">Pinch</span> fingers together to click
                                </p>
                            </div>                        </div>

                        {/* Gesture Hint */}
                        <div className="flex items-center justify-center gap-4 p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 mb-10">
                            <span className="material-symbols-outlined text-indigo-400">back_hand</span>
                            <p className="text-sm text-indigo-200/70">
                                <span className="font-medium text-indigo-300">Gesture Control</span> will start automatically when you continue
                            </p>
                        </div>
                        {/* Action Button */}
                        <div className="flex justify-center">
                            <button
                                onClick={handleTutorialComplete}
                                className="group flex items-center gap-3 px-10 py-5 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-semibold text-lg hover:from-indigo-600 hover:to-violet-700 transition-all duration-300 shadow-2xl shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-105"
                            >
                                <span>OK</span>
                                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">check</span>
                            </button>
                        </div>

                        {/* Skip option */}
                        <p className="text-center mt-6 text-sm text-white/30">
                            Press <span className="font-medium text-white/50">ESC</span> to skip this tutorial
                        </p>
                    </div>
                </div>
            )}


            {/* ==================== GUIDED STUDIO OVERLAY ==================== */}
            {captureStep !== 'OFF' && captureStep !== 'COMPLETED' && cameraActive && !isManualMode && (!personImages[captureStep.toLowerCase()] || isAutomatedFlow) && (
                <div className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none">
                    {/* Darker backdrop for focus */}
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>

                    {/* Silhouettes / Ghost Guides */}
                    <div className="relative w-[450px] h-[600px] flex flex-col items-center justify-center">
                        {/* Ghost Silhouette based on step */}
                        <div className="absolute inset-0 opacity-20 transition-opacity duration-700 animate-pulse">
                            <span className="material-symbols-outlined text-[500px] text-white">
                                {captureStep === 'FRONT' || captureStep === 'BACK' ? 'body_system' : 'accessibility_new'}
                            </span>
                        </div>

                        {/* Real-time Feedback Pill */}
                        <div className={`px-8 py-4 rounded-[30px] backdrop-blur-2xl border-2 transition-all duration-300 flex flex-col items-center shadow-2xl ${
                            analysis.status === 'ready' ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                        }`}>
                            <h2 className="text-xl font-bold uppercase tracking-wider">{analysis.status === 'ready' ? 'Ready!' : 'Adjusting...'}</h2>
                             <p className="text-sm text-white/70 max-w-[300px] text-center mt-1">
                                {analysis.status === 'ready' ? (narratorMessage || analysis.feedback) : (analysis.feedback || narratorMessage)}
                            </p>
                        </div>

                        {/* Step Indicator */}
                        <div className="mt-8 px-6 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm font-medium uppercase tracking-[0.3em]">
                             Step {['FRONT', 'BACK', 'LEFT', 'RIGHT'].indexOf(captureStep) + 1} of 4: {captureStep}
                        </div>

                        {/* Countdown Overlay */}
                        {countdown !== null && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-[180px] font-black text-emerald-400 animate-ping">
                                    {countdown}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ==================== GENERATING / LOADING OVERLAY ==================== */}
            {isGenerating && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-8">
                    <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-2xl"></div>
                    
                    {/* Ambient scan lines / loading effects */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
                        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_49%,rgba(99,102,241,0.2)_50%,transparent_51%)] bg-[length:100%_4px] animate-scan"></div>
                    </div>

                    <div className="relative z-10 flex flex-col items-center max-w-lg text-center">
                        {/* Loading Animation */}
                        <div className="size-32 mb-10 relative">
                            <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20"></div>
                            <div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 animate-spin"></div>
                            <div className="absolute inset-4 rounded-full border-2 border-dashed border-violet-500/30 animate-reverse-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="material-symbols-outlined text-4xl text-indigo-400 animate-pulse">checkroom</span>
                            </div>
                        </div>

                        <h2 className="text-4xl font-bold text-white mb-4 tracking-tight">
                            {longWaitMessage ? "Almost There..." : "Starting Virtual Try On"}
                        </h2>

                        {/* Stopwatch Timer */}
                        <div className="flex items-center gap-3 mb-6 px-6 py-2 rounded-full bg-white/5 border border-white/10">
                            <span className="material-symbols-outlined text-indigo-400 animate-pulse">timer</span>
                            <span className="text-2xl font-mono text-white/90">
                                {Math.floor(generationTime / 60)}:{String(generationTime % 60).padStart(2, '0')}
                            </span>
                        </div>
                        
                        <p className="text-indigo-200/60 text-lg leading-relaxed mb-8">
                            {longWaitMessage 
                                ? "The system is using more time please wait. We are perfecting your high-fidelity render." 
                                : "Our AI is merging the outfit with your body measurements for a perfect fit."}
                        </p>

                        {/* Progress Bar Simulation */}
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                            <div className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500 bg-[length:200%_100%] animate-shimmer rounded-full"></div>
                        </div>
                        
                        <p className="mt-4 text-[10px] uppercase tracking-[0.3em] text-white/30 font-bold">
                            Processing High-Resolution Frame
                        </p>
                    </div>
                </div>
            )}


            {/* ==================== SCAN COMPLETE MESSAGE ==================== */}
            {captureStep === 'COMPLETED' && !isGenerating && !tryOnResult && (
                <div className="fixed inset-0 z-40 pointer-events-none flex items-center justify-center">
                    <div className="bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 rounded-[40px] p-12 text-center animate-in zoom-in duration-500 shadow-2xl">
                        <div className="size-24 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto mb-6">
                            <span className="material-symbols-outlined text-6xl text-emerald-400">task_alt</span>
                        </div>
                        <p className="text-3xl font-bold text-white">Studio Session Ready!</p>
                        <p className="text-white/50 mt-3 text-lg">We've captured your measurements. You can now change clothes freely.</p>
                        <div className="mt-8 flex gap-4 justify-center">
                            {Object.entries(personImages).map(([angle, img]) => img && (
                                <div key={angle} className="size-16 rounded-xl border border-white/10 overflow-hidden shadow-lg">
                                    <img src={`data:image/jpeg;base64,${img}`} alt={angle} className="w-full h-full object-cover" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Ambient Background */}
            <div className="absolute inset-0 z-0 overflow-hidden">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[200px]"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-violet-500/8 rounded-full blur-[180px]"></div>
            </div>


            {/* Main Layout */}
            <div className="relative z-10 h-full flex p-6 gap-6">

                {/* Left Side - Guidelines Panel */}
                <div className="w-64 flex flex-col rounded-3xl bg-white/[0.03] backdrop-blur-2xl border border-white/10 overflow-hidden">

                    {/* Header */}
                    <div className="p-6 border-b border-white/5">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="size-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                                <span className="material-symbols-outlined text-white text-xl">help_outline</span>
                            </div>
                            <span className="font-semibold text-white text-lg">How It Works</span>
                        </div>
                        <p className="text-xs text-white/40 mt-2">Follow these simple steps</p>
                    </div>

                    {/* Steps */}
                    <div className="flex-1 p-5 space-y-4 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>

                        {/* Step 1 */}
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 size-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                                <span className="text-sm font-bold text-indigo-400">1</span>
                            </div>
                            <div>
                                <h4 className="font-medium text-white text-sm">Position Yourself</h4>
                                <p className="text-xs text-white/50 mt-1 leading-relaxed">Stand in front of the camera so the parts you want to try on are visible</p>
                            </div>
                        </div>

                        {/* Step 2 */}
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 size-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                                <span className="text-sm font-bold text-indigo-400">2</span>
                            </div>
                            <div>
                                <h4 className="font-medium text-white text-sm">Capture Your Body</h4>
                                <p className="text-xs text-white/50 mt-1 leading-relaxed">Click "Start Capturing Body" to scan your body measurements</p>
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 size-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                                <span className="text-sm font-bold text-indigo-400">3</span>
                            </div>
                            <div>
                                <h4 className="font-medium text-white text-sm">Select Clothes</h4>
                                <p className="text-xs text-white/50 mt-1 leading-relaxed">Browse shirts & pants from the right panel and tap to select</p>
                            </div>
                        </div>

                        {/* Step 4 */}
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 size-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                                <span className="text-sm font-bold text-indigo-400">4</span>
                            </div>
                            <div>
                                <h4 className="font-medium text-white text-sm">Virtual Try-On</h4>
                                <p className="text-xs text-white/50 mt-1 leading-relaxed">Click "Virtual Try On" to see clothes fitted on your body</p>
                            </div>
                        </div>

                        {/* Step 5 */}
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 size-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                                <span className="material-symbols-outlined text-emerald-400 text-sm">check</span>
                            </div>
                            <div>
                                <h4 className="font-medium text-white text-sm">Done!</h4>
                                <p className="text-xs text-white/50 mt-1 leading-relaxed">See how the outfit looks on you before buying</p>
                            </div>
                        </div>
                    </div>

                    {/* Tips Footer */}
                    <div className="p-5 border-t border-white/5 bg-white/[0.02]">
                        <div className="flex items-start gap-3">
                            <span className="material-symbols-outlined text-amber-400 text-lg">lightbulb</span>
                            <div>
                                <h4 className="font-medium text-white text-xs uppercase tracking-wider">Pro Tip</h4>
                                <p className="text-xs text-white/40 mt-1">Stand 2-3 meters from the camera for best results</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Camera/Preview Area */}
                <div className="flex-1 relative flex flex-col rounded-3xl overflow-hidden bg-slate-900/50 backdrop-blur-sm border border-white/5">

                    {/* Camera View / Video Feed / Backend Stream */}
                    <div className="absolute inset-0 bg-slate-950">
                        {cameraActive ? (
                            <img
                                src="http://localhost:5000/api/gestures/video_feed"
                                alt="Gesture Feed"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <div className="text-center">
                                    <span className="material-symbols-outlined text-white/10" style={{ fontSize: '180px' }}>person</span>
                                    <p className="text-xl font-extralight text-white/40 tracking-[0.2em] uppercase mt-4">Step into the frame</p>
                                    {cameraError && (
                                        <p className="text-red-400 text-sm mt-4 max-w-md mx-auto">{cameraError}</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Redundant LIVE indicator removed */}

                    {/* Top Bar */}
                    <header className="relative z-10 p-8 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="size-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                                <span className="material-symbols-outlined text-2xl">view_in_ar</span>
                            </div>
                            <div>
                                <span className="font-semibold text-xl tracking-tight text-white block">VirtualFit</span>
                                <span className="text-xs text-white/40 tracking-wide uppercase">Virtual Try-On</span>
                            </div>
                        </div>

                        {/* Gesture Status Indicator */}
                        <div className="flex items-center gap-4">
                            {gestureMode && (
                                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                                    <span className="size-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                    AI Tracking Active
                                </div>
                            )}
                            <button
                                onClick={async () => {
                                    try {
                                        await gesturesAPI.stop();
                                        window.close();
                                    } catch (err) {
                                        window.close();
                                    }
                                }}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-lg"
                            >
                                <span className="material-symbols-outlined text-lg">cancel</span>
                                Stop & Close
                            </button>
                        </div>
                    </header>
                    {/* Main Camera Area - Spacer */}
                    <div className="flex-1 relative">
                        {/* Camera feed fills this area via absolute positioning */}
                    </div>

                    {/* Bottom Controls */}
                    <div className="relative z-10 p-8">
                         <div className="flex items-center justify-center gap-4">
                              {/* Start/Reset Capturing Body Button */}
                            {/* Main CTA moved to Bottom Left or Center - Keeping it centered for now but removing the steps labels */}
                             <button
                                 onClick={() => {
                                     if (captureStep === 'COMPLETED') {
                                         handleResetSession();
                                     } else {
                                        // Dynamic next step logic
                                        const steps = ['FRONT', 'LEFT', 'BACK', 'RIGHT'];
                                        const remaining = steps.filter(s => !personImages[s.toLowerCase()]);
                                        if (remaining.length > 0) {
                                            handleStartCapture(remaining[0]);
                                        } else {
                                            setCaptureStep('COMPLETED');
                                        }
                                     }
                                 }}
                                 disabled={isAutomatedFlow || isGenerating}
                                 className={`flex items-center gap-3 px-10 py-5 rounded-2xl font-black transition-all shadow-xl group ${isAutomatedFlow
                                     ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 cursor-not-allowed'
                                     : captureStep === 'COMPLETED' 
                                         ? 'bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white'
                                         : 'bg-white text-slate-900 hover:scale-105 shadow-white/10'
                                     }`}
                             >
                                 <span className={`material-symbols-outlined text-2xl ${isAutomatedFlow ? 'animate-spin' : 'group-hover:rotate-12 transition-transform'}`}>
                                     {captureStep === 'COMPLETED' ? 'refresh' : isAutomatedFlow ? 'progress_activity' : 'camera'}
                                 </span>
                                 <span className="text-base uppercase tracking-widest">
                                     {captureStep === 'COMPLETED' ? 'New Session' : isAutomatedFlow ? `Adjusting...` : 'Quick Snap'}
                                 </span>
                             </button>

                            {/* Studio Reset Button (Inside Profile now) */}


                            {/* Virtual Try On Button */}
                            <button
                                onClick={handleVirtualTryOn}
                                className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-white font-bold transition-all shadow-xl group ${cameraActive && personImages.front && (selectedUpper || selectedLower) && !isGenerating && !isAutomatedFlow
                                    ? 'bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 hover:scale-105 shadow-indigo-500/30'
                                    : 'bg-gray-600/50 cursor-not-allowed opacity-50'
                                    }`}
                                disabled={!cameraActive || !personImages.front || (!selectedUpper && !selectedLower) || isGenerating || isAutomatedFlow}
                            >
                                <span className={`material-symbols-outlined text-2xl ${isGenerating ? 'animate-spin' : 'group-hover:animate-pulse'}`}>
                                    {isGenerating ? 'progress_activity' : 'shopping_bag'}
                                </span>
                                <span className="text-lg">
                                    {isGenerating ? 'Processing...' : 'Virtual Try On'}
                                </span>
                            </button>
                        </div>


                        <div className="flex justify-center mt-4">
                            <button
                                onClick={() => {
                                    fetchProducts();
                                    setShowTutorial(true);
                                }}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/50 text-sm hover:bg-white/10 hover:text-white/80 transition-all"
                                title="Refresh products"
                            >
                                <span className="material-symbols-outlined text-lg">refresh</span>
                                <span>Refresh</span>
                            </button>
                        </div>
                    </div>

                </div>

                {/* Right Side Panel */}
                <div className="w-64 flex flex-col gap-4">
 
                    {/* Studio Profile Grid */}
                    <div className="rounded-3xl bg-white/[0.03] backdrop-blur-2xl border border-white/10 p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">camera_front</span>
                                Studio Profile
                            </h3>
                            {Object.values(personImages).some(img => img) && (
                                <button 
                                    onClick={handleResetSession}
                                    className="text-[8px] font-bold text-red-400 hover:text-red-300 uppercase tracking-tighter"
                                >
                                    Reset All
                                </button>
                            )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                            {['FRONT', 'LEFT', 'BACK', 'RIGHT'].map(angle => {
                                const angleKey = angle.toLowerCase();
                                const isCaptured = !!personImages[angleKey];
                                const isActive = captureStep === angle && isAutomatedFlow;

                                return (
                                    <div key={angle} className={`relative group rounded-xl border transition-all overflow-hidden aspect-square ${isActive ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-500/5' : isCaptured ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/5 bg-white/[0.02]'}`}>
                                        {isCaptured ? (
                                            <img src={`data:image/jpeg;base64,${personImages[angleKey]}`} className="w-full h-full object-cover" alt={angle} />
                                        ) : (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center text-white/10">
                                                <span className="material-symbols-outlined text-2xl">person_outline</span>
                                                <span className="text-[7px] font-bold uppercase mt-1 opacity-50">{angle}</span>
                                            </div>
                                        )}
                                        
                                        {/* Overlay Controls */}
                                        <div className={`absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                            <button
                                                onClick={() => handleStartCapture(angle)}
                                                disabled={isAutomatedFlow || isGenerating}
                                                className="size-10 rounded-full bg-white text-slate-900 flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                title={`Capture ${angle}`}
                                            >
                                                <span className={`material-symbols-outlined ${isActive ? 'animate-spin text-sm' : ''}`}>
                                                    {isActive ? 'progress_activity' : (isCaptured ? 'refresh' : 'videocam')}
                                                </span>
                                            </button>
                                        </div>

                                        {/* Active Badge */}
                                        {isActive && (
                                            <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded-full bg-indigo-500 text-[6px] font-black text-white animate-pulse">
                                                LIVE
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Active Selection Panel */}
                    <div className="rounded-3xl bg-white/[0.03] backdrop-blur-2xl border border-white/10 p-5">
                        <h3 className="font-medium text-white/50 text-[10px] uppercase tracking-widest mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-xs text-indigo-400">checkroom</span>
                            Active Selection
                        </h3>

                        <div className="space-y-2">
                            {['upper', 'lower'].map(cat => {
                                const selected = cat === 'upper' ? selectedUpper : selectedLower;
                                const setter = cat === 'upper' ? setSelectedUpper : setSelectedLower;
                                
                                return (
                                    <div key={cat} className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${selected ? 'bg-white/5 border border-white/10' : 'border border-dashed border-white/10 opcity-40'}`}>
                                        {selected ? (
                                            <>
                                                <div className="size-10 rounded-lg overflow-hidden flex-shrink-0 bg-white/5">
                                                    <img src={getProductImage(selected)} alt="" className="w-full h-full object-cover" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[10px] font-bold truncate text-white/90">{selected.name}</p>
                                                    <p className="text-[9px] text-indigo-400 font-black">${selected.price?.toFixed(2)}</p>
                                                </div>
                                                <button onClick={() => setter(null)} className="text-white/20 hover:text-white transition-colors">
                                                    <span className="material-symbols-outlined text-sm">close</span>
                                                </button>
                                            </>
                                        ) : (
                                            <div className="flex items-center gap-2 text-white/20 py-0.5">
                                                <span className="material-symbols-outlined text-sm">checkroom</span>
                                                <span className="text-[9px] font-medium tracking-tight">Empty {cat} slot</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Products Panel */}
                    <div className="flex-1 flex flex-col rounded-3xl bg-white/[0.03] backdrop-blur-2xl border border-white/10 overflow-hidden">

                        {/* Category Dropdown Header */}
                        <div className="p-5 border-b border-white/5">
                            <div className="relative">
                                <select
                                    value={activeCategory}
                                    onChange={(e) => setActiveCategory(e.target.value)}
                                    className="w-full appearance-none bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 pr-10 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer text-sm font-medium"
                                >
                                    <option value="all" className="bg-slate-900 text-white">All Categories</option>
                                    <option value="upper" className="bg-slate-900 text-white">Shirts & Tops</option>
                                    <option value="lower" className="bg-slate-900 text-white">Pants & Bottoms</option>
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/50">
                                    <span className="material-symbols-outlined">expand_more</span>
                                </div>
                            </div>
                        </div>

                        {/* Carousel Content */}
                        <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center text-white/50">
                                    <span className="material-symbols-outlined animate-spin text-2xl">progress_activity</span>
                                    <p className="text-xs mt-3">Loading...</p>
                                </div>
                            ) : filteredProducts.length === 0 ? (
                                <div className="flex flex-col items-center justify-center text-white/40 text-center">
                                    <span className="material-symbols-outlined text-3xl">inventory_2</span>
                                    <p className="text-xs mt-3">No products found</p>
                                </div>
                            ) : currentProduct && (
                                <div className="w-full flex flex-col items-center animate-in fade-in zoom-in duration-300">

                                    {/* Product Card */}
                                    <button
                                        onClick={() => handleProductSelect(currentProduct)}
                                        className={`w-full aspect-[3/4] max-w-[200px] rounded-2xl overflow-hidden relative group transition-all duration-300 shadow-2xl ${(selectedUpper?.id === currentProduct.id || selectedLower?.id === currentProduct.id)
                                            ? 'ring-2 ring-indigo-500 ring-offset-4 ring-offset-gray-900 grayscale-0'
                                            : 'ring-1 ring-white/10 hover:ring-white/30'
                                            }`}
                                    >
                                        <img
                                            src={getProductImage(currentProduct)}
                                            alt={currentProduct.name}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>

                                        <div className="absolute bottom-0 left-0 right-0 p-4 text-left">
                                            <p className="font-semibold text-white truncate text-lg shadow-black drop-shadow-md">{currentProduct.name}</p>
                                            <p className="text-indigo-400 font-bold mt-1">${currentProduct.price?.toFixed(2)}</p>
                                        </div>

                                        {(selectedUpper?.id === currentProduct.id || selectedLower?.id === currentProduct.id) && (
                                            <div className="absolute top-3 right-3 size-8 rounded-full bg-indigo-500 flex items-center justify-center shadow-lg">
                                                <span className="material-symbols-outlined text-white text-sm">check</span>
                                            </div>
                                        )}
                                    </button>

                                    {/* Navigation Controls */}
                                    <div className="flex items-center gap-6 mt-8">
                                        <button
                                            onClick={prevProduct}
                                            className="size-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-indigo-500 hover:border-indigo-500 transition-all hover:scale-110 active:scale-95 group"
                                        >
                                            <span className="material-symbols-outlined group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
                                        </button>

                                        <div className="text-xs font-medium text-white/30 tracking-widest">
                                            {currentProductIndex + 1} / {filteredProducts.length}
                                        </div>

                                        <button
                                            onClick={nextProduct}
                                            className="size-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-indigo-500 hover:border-indigo-500 transition-all hover:scale-110 active:scale-95 group"
                                        >
                                            <span className="material-symbols-outlined group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
                                        </button>
                                    </div>

                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {/* ==================== TRY-ON RESULT MODAL ==================== */}
            {tryOnResult && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-8">
                    <div 
                        className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl"
                        onClick={() => setTryOnResult(null)}
                    ></div>
                    
                    <div className="relative z-10 w-full max-w-4xl bg-slate-900 border border-white/10 rounded-[40px] overflow-hidden shadow-2xl animate-in zoom-in duration-500">
                        <div className="flex h-[600px]">
                            {/* Comparison / Result View */}
                            <div className="flex-1 bg-black flex items-center justify-center p-4">
                                <img 
                                    src={tryOnResult} 
                                    alt="Virtual Try-On Result" 
                                    className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl shadow-indigo-500/20"
                                />
                            </div>
                            
                            {/* Controls Panel */}
                            <div className="w-80 p-8 flex flex-col bg-white/[0.02] border-l border-white/5">
                                <div className="mb-8">
                                    <h2 className="text-2xl font-semibold mb-2">Virtual Look</h2>
                                    <p className="text-white/40 text-sm">Processed by IDM-VTON Core</p>
                                </div>
                                
                                <div className="space-y-4 mb-auto">
                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                                        <div className="text-xs text-white/30 uppercase tracking-widest mb-3">Model Details</div>
                                        <div className="flex items-center gap-3">
                                            <div className="size-10 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-emerald-400 text-sm">stars</span>
                                            </div>
                                            <span className="text-sm font-medium">Ultra High Fidelity</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="space-y-3">
                                    <button 
                                        onClick={() => window.open(tryOnResult, '_blank')}
                                        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 font-bold hover:scale-[1.02] transition-transform active:scale-95"
                                    >
                                        <span className="material-symbols-outlined">download</span>
                                        Download Image
                                    </button>
                                    <button 
                                        onClick={() => setTryOnResult(null)}
                                        className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 font-medium hover:bg-white/10 transition-colors"
                                    >
                                        Back to Studio
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        {/* Close button top right */}
                        <button 
                            onClick={() => setTryOnResult(null)}
                            className="absolute top-6 right-6 size-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Error Toast */}
            {error && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[110] animate-in slide-in-from-bottom-5 duration-300">
                    <div className="px-6 py-4 rounded-2xl bg-red-500/10 border border-red-500/30 backdrop-blur-xl text-red-500 flex items-center gap-3 shadow-2xl">
                        <span className="material-symbols-outlined">error</span>
                        <span className="font-medium">{error}</span>
                        <button onClick={() => setError(null)} className="ml-4 opacity-50 hover:opacity-100">
                            <span className="material-symbols-outlined text-lg">close</span>
                        </button>
                    </div>
                </div>
            )}

            {/* ==================== VIRTUAL CURSOR ==================== */}
            {gestureMode && (
                <div
                    className="fixed z-[9999] pointer-events-none transition-transform duration-75 ease-out"
                    style={{
                        left: mousePos.x,
                        top: mousePos.y,
                        transform: `translate(-50%, -50%) scale(${isClicked ? 0.8 : 1})`,
                    }}
                >
                    {/* Main glowing dot */}
                    <div className={`relative size-8 rounded-full border-2 border-white flex items-center justify-center transition-all duration-150 ${isClicked ? 'bg-indigo-500 shadow-[0_0_25px_rgba(99,102,241,0.8)]' : 'bg-white/20 backdrop-blur-sm shadow-[0_0_15px_rgba(255,255,255,0.5)]'}`}>
                        {/* Target icon */}
                        <div className={`size-1 rounded-full bg-white ${isClicked ? 'scale-0' : 'scale-100'}`}></div>

                        {/* Outer rings */}
                        <div className="absolute inset-[-4px] rounded-full border border-white/20 animate-spin-slow"></div>
                        <div className="absolute inset-[-8px] rounded-full border border-white/10 animate-pulse"></div>
                    </div>

                    {/* Visual label */}
                    <div className="absolute top-10 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-1 rounded bg-black/80 text-[8px] font-bold text-white uppercase tracking-tighter border border-white/10 backdrop-blur-sm">
                        Virtual Pointer
                    </div>
                </div>
            )}
        </div>
    );
};

export default TryOn;
