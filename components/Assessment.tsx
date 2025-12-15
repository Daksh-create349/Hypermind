import React, { useState, useEffect } from 'react';
import { Check, X, BrainCircuit, Activity, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { Card } from './ui/card';

interface AssessmentProps {
    userProfile: {
        qualification: string;
        learningDepth: string;
        subjects: string[];
        ageRange: string;
    };
    onComplete: (result: { score: number; analysis: string }) => void;
}

interface Question {
    text: string;
    options: string[];
    correctIndex: number;
    explanation: string;
}

interface SessionLogItem {
    question: string;
    difficulty: number;
    userAnswer: string;
    isCorrect: boolean;
}

const QUESTION_BANK: Record<string, Question[]> = {
    "Computer Science": [
        { text: "Which data structure operates on a LIFO basis?", options: ["Queue", "Stack", "Array", "Tree"], correctIndex: 1, explanation: "Stack follows Last-In, First-Out (LIFO) principle." },
        { text: "What is the time complexity of binary search?", options: ["O(n)", "O(n^2)", "O(log n)", "O(1)"], correctIndex: 2, explanation: "Binary search halves the search space with each step." },
        { text: "Which protocol is used for secure web browsing?", options: ["HTTP", "FTP", "HTTPS", "SMTP"], correctIndex: 2, explanation: "HTTPS (Hypertext Transfer Protocol Secure) uses encryption." },
        { text: "What is the primary function of an OS?", options: ["Compile code", "Manage resources", "Browse web", "Edit text"], correctIndex: 1, explanation: "The OS manages hardware and software resources." },
        { text: "In SQL, which command retrieves data?", options: ["UPDATE", "DELETE", "SELECT", "INSERT"], correctIndex: 2, explanation: "SELECT is used to query data from a database." }
    ],
    "Physics": [
        { text: "What is the SI unit of Force?", options: ["Joule", "Watt", "Newton", "Pascal"], correctIndex: 2, explanation: "Newton (N) is the standard unit of force." },
        { text: "What is the speed of light in a vacuum?", options: ["3x10^8 m/s", "3x10^6 m/s", "300 km/h", "Speed of sound"], correctIndex: 0, explanation: "Approximately 299,792,458 meters per second." },
        { text: "Newton's Second Law is expressed as?", options: ["F=m/a", "F=ma", "F=m^2a", "F=a/m"], correctIndex: 1, explanation: "Force equals mass times acceleration." },
        { text: "Which particle carries a negative charge?", options: ["Proton", "Neutron", "Electron", "Photon"], correctIndex: 2, explanation: "Electrons are negatively charged subatomic particles." },
        { text: "Energy cannot be created or destroyed is which law?", options: ["1st Law of Thermo", "2nd Law of Thermo", "Hooke's Law", "Ohm's Law"], correctIndex: 0, explanation: "Conservation of Energy is the First Law of Thermodynamics." }
    ],
    "Mathematics": [
        { text: "What is the derivative of x^2?", options: ["x", "2x", "2", "x^2"], correctIndex: 1, explanation: "Using the power rule: d/dx(x^n) = nx^(n-1)." },
        { text: "What is the value of Pi (approx)?", options: ["3.12", "3.14", "3.16", "3.18"], correctIndex: 1, explanation: "Pi is approximately 3.14159." },
        { text: "A prime number is divisible by?", options: ["Any odd number", "1 and itself", "2", "3"], correctIndex: 1, explanation: "Prime numbers have exactly two factors: 1 and themselves." },
        { text: "Sum of angles in a triangle?", options: ["180°", "360°", "90°", "270°"], correctIndex: 0, explanation: "In Euclidean geometry, triangle angles sum to 180 degrees." },
        { text: "What is the square root of 144?", options: ["10", "11", "12", "13"], correctIndex: 2, explanation: "12 * 12 = 144." }
    ],
    "History": [
        { text: "When did World War I begin?", options: ["1912", "1914", "1918", "1939"], correctIndex: 1, explanation: "WWI began in July 1914." },
        { text: "Which civilization built the pyramids?", options: ["Romans", "Greeks", "Egyptians", "Mayans"], correctIndex: 2, explanation: "Ancient Egyptians built the Giza pyramids." },
        { text: "Who was the first man on the moon?", options: ["Yuri Gagarin", "Buzz Aldrin", "Neil Armstrong", "John Glenn"], correctIndex: 2, explanation: "Neil Armstrong walked on the moon in 1969." },
        { text: "The fall of the Berlin Wall occurred in?", options: ["1987", "1989", "1991", "1985"], correctIndex: 1, explanation: "It fell on November 9, 1989." },
        { text: "Julius Caesar ruled which empire?", options: ["Greek", "Roman", "Ottoman", "Persian"], correctIndex: 1, explanation: "He was a dictator of the Roman Republic." }
    ],
    "Biology": [
        { text: "What is the 'powerhouse' of the cell?", options: ["Nucleus", "Ribosome", "Mitochondria", "Golgi Body"], correctIndex: 2, explanation: "Mitochondria generate most of the cell's supply of adenosine triphosphate (ATP)." },
        { text: "What molecule carries genetic instructions?", options: ["RNA", "Protein", "DNA", "Lipid"], correctIndex: 2, explanation: "Deoxyribonucleic acid (DNA) stores genetic info." },
        { text: "Which blood cells carry oxygen?", options: ["White cells", "Platelets", "Red cells", "Plasma"], correctIndex: 2, explanation: "Red blood cells contain hemoglobin to transport oxygen." },
        { text: "What is the process of plants making food?", options: ["Respiration", "Photosynthesis", "Digestion", "Absorption"], correctIndex: 1, explanation: "Plants use sunlight to synthesize nutrients." },
        { text: "What is the largest organ in the human body?", options: ["Liver", "Brain", "Skin", "Heart"], correctIndex: 2, explanation: "Skin is the largest organ by surface area and weight." }
    ],
    "Economics": [
        { text: "The Law of Demand states that as price rises...?", options: ["Demand rises", "Demand falls", "Supply falls", "Demand stays same"], correctIndex: 1, explanation: "There is an inverse relationship between price and quantity demanded." },
        { text: "What does GDP stand for?", options: ["Gross Domestic Product", "Global Daily Production", "Gross Domestic Profit", "General Data Protection"], correctIndex: 0, explanation: "GDP measures the value of goods/services produced in a country." },
        { text: "A market with a single seller is a?", options: ["Oligopoly", "Monopoly", "Perfect Competition", "Duopoly"], correctIndex: 1, explanation: "Monopoly implies one dominant seller." },
        { text: "Inflation is defined as?", options: ["Fall in prices", "Rise in prices", "Stable prices", "Zero unemployment"], correctIndex: 1, explanation: "Inflation is the rate at which the general level of prices is rising." },
        { text: "Opportunity Cost is?", options: ["Total cost", "Cost of next best alternative", "Sunk cost", "Fixed cost"], correctIndex: 1, explanation: "The benefit missed when choosing one alternative over another." }
    ],
    "Philosophy": [
        { text: "Who said 'I think, therefore I am'?", options: ["Plato", "Aristotle", "Descartes", "Socrates"], correctIndex: 2, explanation: "René Descartes (Cogito, ergo sum)." },
        { text: "Ethics is the study of?", options: ["Knowledge", "Beauty", "Morality", "Logic"], correctIndex: 2, explanation: "Ethics involves systematizing, defending, and recommending concepts of right and wrong behavior." },
        { text: "Plato was a student of?", options: ["Socrates", "Aristotle", "Kant", "Hume"], correctIndex: 0, explanation: "Socrates taught Plato, who taught Aristotle." },
        { text: "What does 'Philosophy' literally mean?", options: ["Love of wisdom", "Study of life", "Art of thinking", "Science of mind"], correctIndex: 0, explanation: "From Greek: Philo (love) + Sophia (wisdom)." },
        { text: "Logic is primarily concerned with?", options: ["Art", "Valid reasoning", "Emotion", "History"], correctIndex: 1, explanation: "Logic is the study of correct reasoning." }
    ],
    "Psychology": [
        { text: "Who is the father of Psychoanalysis?", options: ["Jung", "Freud", "Skinner", "Pavlov"], correctIndex: 1, explanation: "Sigmund Freud founded the discipline." },
        { text: "Pavlov's dogs demonstrated?", options: ["Operant conditioning", "Classical conditioning", "Social learning", "Cognitive dissonance"], correctIndex: 1, explanation: "Learning through association." },
        { text: "The capacity of short-term memory is approx?", options: ["Unlimited", "7 +/- 2 items", "100 items", "2 items"], correctIndex: 1, explanation: "Miller's Law suggests 7 plus or minus 2." },
        { text: "Who proposed the Hierarchy of Needs?", options: ["Maslow", "Rogers", "Bandura", "Piaget"], correctIndex: 0, explanation: "Abraham Maslow." },
        { text: "Cognitive psychology studies?", options: ["Behavior only", "Mental processes", "Social groups", "Genetics"], correctIndex: 1, explanation: "It focuses on memory, perception, and thought." }
    ],
    "Literature": [
        { text: "Who wrote 'Romeo and Juliet'?", options: ["Dickens", "Hemingway", "Shakespeare", "Austen"], correctIndex: 2, explanation: "William Shakespeare." },
        { text: "The protagonist of '1984' is?", options: ["Winston Smith", "Big Brother", "O'Brien", "Julia"], correctIndex: 0, explanation: "Winston Smith is the main character." },
        { text: "A haiku has how many syllables?", options: ["5-7-5", "7-5-7", "5-5-5", "10-10-10"], correctIndex: 0, explanation: "Japanese poetic form consisting of 17 syllables." },
        { text: "Who wrote 'To Kill a Mockingbird'?", options: ["Harper Lee", "Mark Twain", "Steinbeck", "Fitzgerald"], correctIndex: 0, explanation: "Harper Lee published it in 1960." },
        { text: "What is the main theme of 'The Great Gatsby'?", options: ["War", "The American Dream", "Space Travel", "Medieval Honor"], correctIndex: 1, explanation: "It critiques the American Dream in the 1920s." }
    ],
    "Business": [
        { text: "ROI stands for?", options: ["Return on Investment", "Rate of Interest", "Risk of Inflation", "Return on Income"], correctIndex: 0, explanation: "A measure used to evaluate the efficiency of an investment." },
        { text: "What is a 'Bear Market'?", options: ["Prices rising", "Prices falling", "Stable prices", "Volatile prices"], correctIndex: 1, explanation: "A market condition where prices are falling." },
        { text: "SWOT analysis stands for?", options: ["Strengths, Weaknesses, Opportunities, Threats", "Sales, Wealth, Options, Taxes", "Systems, Web, Operations, Tech", "None"], correctIndex: 0, explanation: "Strategic planning technique." },
        { text: "What is a liability?", options: ["Asset", "Debt/Obligation", "Profit", "Equity"], correctIndex: 1, explanation: "Something a person or company owes." },
        { text: "B2B means?", options: ["Business to Business", "Back to Business", "Buyer to Buyer", "Business to Buyer"], correctIndex: 0, explanation: "Commerce between two businesses." }
    ],
    "Political Science": [
        { text: "Democracy literally means?", options: ["Rule by one", "Rule by the people", "Rule by law", "Rule by few"], correctIndex: 1, explanation: "Demos (people) + Kratos (power)." },
        { text: "Separation of Powers divides govt into?", options: ["2 branches", "3 branches", "4 branches", "5 branches"], correctIndex: 1, explanation: "Legislative, Executive, and Judicial." },
        { text: "Who wrote 'The Prince'?", options: ["Machiavelli", "Plato", "Hobbes", "Locke"], correctIndex: 0, explanation: "Niccolò Machiavelli." },
        { text: "What is a constitution?", options: ["A law", "Supreme law of land", "A treaty", "A suggestion"], correctIndex: 1, explanation: "Fundamental principles governing a state." },
        { text: "The UN headquarters is in?", options: ["Geneva", "London", "Paris", "New York"], correctIndex: 3, explanation: "New York City." }
    ],
    "Art & Design": [
        { text: "Which is a primary color?", options: ["Green", "Orange", "Blue", "Purple"], correctIndex: 2, explanation: "Red, Yellow, and Blue are primary colors." },
        { text: "Who painted the Mona Lisa?", options: ["Van Gogh", "Da Vinci", "Picasso", "Michelangelo"], correctIndex: 1, explanation: "Leonardo da Vinci." },
        { text: "What is negative space?", options: ["Dark areas", "Empty space around object", "Background noise", "Mistake"], correctIndex: 1, explanation: "The space around and between the subject(s)." },
        { text: "Bauhaus was a famous school for?", options: ["Music", "Cooking", "Design & Architecture", "Law"], correctIndex: 2, explanation: "German art school operational from 1919 to 1933." },
        { text: "Complementary color of Red?", options: ["Blue", "Yellow", "Green", "Purple"], correctIndex: 2, explanation: "Green is opposite Red on the color wheel." }
    ]
};

const GENERAL_QUESTIONS: Question[] = [
    { text: "Which approach solves problems by breaking them down?", options: ["Holistic", "Reductionist", "Abstract", "Intuitive"], correctIndex: 1, explanation: "Reductionism breaks complex phenomena into parts." },
    { text: "Primary source of data?", options: ["Textbook", "Original Experiment", "Encyclopedia", "Review Article"], correctIndex: 1, explanation: "Original data collected firsthand." },
    { text: "Validity refers to?", options: ["Consistency", "Accuracy", "Speed", "Cost"], correctIndex: 1, explanation: "Measuring what it claims to measure." },
    { text: "First step in Scientific Method?", options: ["Experiment", "Conclusion", "Observation", "Hypothesis"], correctIndex: 2, explanation: "Observation leads to questions." },
    { text: "What is a hypothesis?", options: ["Proven fact", "Wild guess", "Testable prediction", "Final theory"], correctIndex: 2, explanation: "A proposed explanation made on limited evidence." }
];

export function Assessment({ userProfile, onComplete }: AssessmentProps) {
    const [qIndex, setQIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [sessionLog, setSessionLog] = useState<SessionLogItem[]>([]);
    
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [feedback, setFeedback] = useState<string>("");
    const [subjectQuestions, setSubjectQuestions] = useState<Question[]>([]);

    useEffect(() => {
        // Initialize questions based on primary subject or fallback
        const subject = userProfile.subjects.length > 0 ? userProfile.subjects[0] : "General";
        const bank = QUESTION_BANK[subject] || GENERAL_QUESTIONS;
        setSubjectQuestions(bank);
        
        // Load first question
        setCurrentQuestion(bank[0]);
        setLoading(false);
    }, [userProfile.subjects]);

    const handleAnswer = (index: number) => {
        if (isAnswered || !currentQuestion) return;
        
        setSelectedOption(index);
        setIsAnswered(true);
        
        const isCorrect = index === currentQuestion.correctIndex;
        const pts = isCorrect ? 20 : 0; // 5 questions * 20 pts = 100 max
        
        setSessionLog(prev => [...prev, {
            question: currentQuestion.text,
            difficulty: 3,
            userAnswer: currentQuestion.options[index],
            isCorrect: isCorrect
        }]);

        if (isCorrect) {
            setScore(s => s + pts);
            setFeedback("Correct! Well done.");
        } else {
            setFeedback("Incorrect.");
        }

        setTimeout(() => {
            handleNext(isCorrect);
        }, 1200);
    };

    const handleNext = (lastCorrect: boolean) => {
        if (qIndex + 1 >= 5) { 
            // Add points for last question if correct
            finishAssessment(score + (lastCorrect ? 20 : 0));
        } else {
            const nextIndex = qIndex + 1;
            setQIndex(nextIndex);
            setLoading(true);
            
            // Simulate brief loading for UX
            setTimeout(() => {
                setCurrentQuestion(subjectQuestions[nextIndex]);
                setLoading(false);
                setIsAnswered(false);
                setSelectedOption(null);
                setFeedback("");
            }, 400);
        }
    };

    const finishAssessment = async (finalScore: number) => {
        setAnalyzing(true);
        
        // Local analysis generation to avoid API Quota/Errors
        setTimeout(() => {
            const subject = userProfile.subjects[0] || "General Knowledge";
            let fallbackAnalysis = "";
            
            if (finalScore >= 80) {
                 fallbackAnalysis = `Outstanding performance in ${subject}. You demonstrate strong intuition and conceptual clarity. Recommended Path: Advanced Specialization & accelerated curriculum.`;
            } else if (finalScore >= 60) {
                 fallbackAnalysis = `Solid proficiency in ${subject}. You have a good grasp of the basics but may need to refine some core principles. Recommended Path: Intermediate Concepts with practical application.`;
            } else {
                 fallbackAnalysis = `Foundational understanding of ${subject} detected. We will focus on building core mental models and reinforcing basics. Recommended Path: Core Fundamentals.`;
            }

            onComplete({
                score: finalScore,
                analysis: fallbackAnalysis
            });
        }, 1500); // Simulate analysis time
    };

    if (analyzing) {
        return (
             <div className="w-full h-full flex flex-col items-center justify-center p-6 text-white">
                <Loader2 size={32} className="animate-spin mb-4 text-indigo-500" />
                <p>Analyzing Performance...</p>
             </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-2xl space-y-8">
                <div className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-3">
                         <BrainCircuit size={20} />
                         <div>
                             <h2 className="text-xl font-bold">Skill Verification</h2>
                             <p className="text-xs text-neutral-400">Baseline Assessment</p>
                         </div>
                    </div>
                    <div>{qIndex + 1}/05</div>
                </div>

                <div className="h-1 w-full bg-neutral-800 rounded-full overflow-hidden">
                    <div className="h-full bg-white transition-all duration-500" style={{ width: `${((qIndex) / 5) * 100}%` }} />
                </div>

                <div className="relative min-h-[300px]">
                    {loading ? (
                        <div className="absolute inset-0 flex items-center justify-center text-white">
                            <Loader2 size={32} className="animate-spin" />
                        </div>
                    ) : currentQuestion ? (
                        <Card className="bg-neutral-900/80 border-white/10 p-8 rounded-3xl text-white">
                             <h3 className="text-xl font-medium mb-8">{currentQuestion.text}</h3>
                             <div className="grid gap-3">
                                 {currentQuestion.options.map((option, idx) => {
                                     const isSelected = selectedOption === idx;
                                     const isCorrect = idx === currentQuestion.correctIndex;
                                     let style = "border-white/10 hover:bg-white/5";
                                     if (isAnswered) {
                                         if (isCorrect) style = "bg-green-900/50 border-green-500";
                                         else if (isSelected) style = "bg-red-900/50 border-red-500";
                                     }
                                     return (
                                        <button key={idx} onClick={() => handleAnswer(idx)} disabled={isAnswered} className={cn("w-full text-left p-4 rounded-xl border transition-all", style)}>
                                            {option}
                                        </button>
                                     );
                                 })}
                             </div>
                             {isAnswered && (
                                 <div className="mt-6 p-4 rounded-xl bg-black/40 border border-white/5">
                                     <p className="text-sm font-medium">{feedback}</p>
                                     <p className="text-xs text-neutral-500 mt-1">{currentQuestion.explanation}</p>
                                 </div>
                             )}
                        </Card>
                    ) : null}
                </div>
            </div>
        </div>
    );
}