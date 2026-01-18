import { User, Course, Chapter, Slide, LearningEvent } from "./types";

const MOCK_USER: User = {
    id: "student_123",
    name: "Amy",
    role: "student",
    profile: {
        optimalFormat: "text",
        pace: "moderate",
        attentionSpanMinutes: 15,
        bestTimeOfDay: "evening",
        processingStyle: "bottom_up",
        confidenceScore: 0.87,
    },
    preferences: {
        lightMode: false,
        dyslexicFont: false,
        textSize: "medium",
        autoAdapt: true,
        showConfidence: true,
        pace: "moderate",
    },
};

const MOCK_SLIDES: Slide[] = [
    {
        id: "slide_1",
        slideid: "slide_1",
        title: "Introduction to Derivatives",
        chapterId: "chapter_1",
        variants: {
            // visual: {
            //     type: "visual",
            //     content:
            //         "<div class='p-4 bg-muted rounded-lg'><h3 class='text-lg font-bold mb-2'>Visualizing the Derivative</h3><div class='aspect-video bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded flex flex-col items-center justify-center'><div class='text-center'><p class='text-lg font-semibold text-blue-700 dark:text-blue-300 mb-2'>Tangent Line Animation</p><p class='text-sm text-gray-600 dark:text-gray-400'>Watch how the slope changes as we move along the curve</p><svg class='mt-4' width='200' height='120' viewBox='0 0 200 120'><path d='M 10 110 Q 60 20 190 10' stroke='currentColor' fill='none' stroke-width='2'/><line x1='80' y1='5' x2='120' y2='115' stroke='red' stroke-width='2'/><circle cx='100' cy='60' r='4' fill='red'/></svg></div></div></div>",
            //     durationEstimate: 45,
            // },
            text: {
                type: "text",
                content:
                    "<div class='prose dark:prose-invert'><h3>Key Definitions</h3><ul><li><strong>Derivative:</strong> The instantaneous rate of change of a function at a point; geometrically represents the slope of the tangent line to the curve at that point.</li><li><strong>Notation:</strong> Written as f'(x), dy/dx, or df/dx for a function f(x).</li><li><strong>Definition:</strong> f'(x) = lim[h→0] (f(x+h) - f(x))/h</li><li><strong>Interpretation:</strong> Tells us how quickly the function value is changing at any given point.</li></ul></div>",
                durationEstimate: 35,
            },
            example: {
                type: "example",
                content:
                    "<div class='p-4 border-2 border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50 dark:bg-blue-950/30'><h4 class='font-bold text-lg mb-3'>Worked Example 1: Power Rule</h4><p class='mb-2'><strong>Problem:</strong> Find the derivative of f(x) = x³</p><div class='ml-4 space-y-2'><p><strong>Step 1:</strong> Identify the power rule: d/dx[x^n] = nx^(n-1)</p><p><strong>Step 2:</strong> Apply with n = 3</p><p class='font-mono bg-white dark:bg-gray-900 p-2 rounded'>f'(x) = 3x^(3-1) = 3x²</p></div><p class='mt-3 text-sm text-gray-600 dark:text-gray-400'><strong>Interpretation:</strong> At any point x, the function is changing at a rate of 3x².</p></div>",
                durationEstimate: 60,
            }
        }
    },
    {
        id: "course_calc_101",
        slideid: "slide_2",
        chapterId: "chapter_1",
        title: "Basic Derivative Rules",
        variants: {
            text: {
                type: "text",
                content:
                    "<div class='prose dark:prose-invert'><h3>Essential Derivative Rules</h3><ul><li><strong>Power Rule:</strong> d/dx[x^n] = nx^(n-1)</li><li><strong>Constant Rule:</strong> d/dx[c] = 0 (where c is a constant)</li><li><strong>Constant Multiple Rule:</strong> d/dx[cf(x)] = c·f'(x)</li><li><strong>Sum Rule:</strong> d/dx[f(x) + g(x)] = f'(x) + g'(x)</li></ul><p class='mt-4'>These rules form the foundation for finding derivatives of polynomial functions.</p></div>",
                durationEstimate: 40,
            },
            // visual: {
            //     type: "visual",
            //     content:
            //         "<div class='p-4 bg-muted rounded-lg'><h3 class='text-lg font-bold mb-2'>Rule Visualization</h3><div class='grid grid-cols-2 gap-4'><div class='p-3 bg-green-100 dark:bg-green-900/30 rounded'><p class='font-semibold text-green-800 dark:text-green-300'>Power Rule</p><p class='text-sm font-mono mt-2'>x³ → 3x²</p><p class='text-xs mt-1'>Bring down exponent, reduce power by 1</p></div><div class='p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded'><p class='font-semibold text-yellow-800 dark:text-yellow-300'>Constant Rule</p><p class='text-sm font-mono mt-2'>5 → 0</p><p class='text-xs mt-1'>Constants don't change</p></div><div class='p-3 bg-purple-100 dark:bg-purple-900/30 rounded'><p class='font-semibold text-purple-800 dark:text-purple-300'>Sum Rule</p><p class='text-sm font-mono mt-2'>(x² + x³)' = 2x + 3x²</p><p class='text-xs mt-1'>Differentiate each term separately</p></div><div class='p-3 bg-blue-100 dark:bg-blue-900/30 rounded'><p class='font-semibold text-blue-800 dark:text-blue-300'>Constant Multiple</p><p class='text-sm font-mono mt-2'>(5x²)' = 5(2x) = 10x</p><p class='text-xs mt-1'>Factor out constants</p></div></div></div>",
            //     durationEstimate: 50,
            // },
            example: {
                type: "example",
                content:
                    "<div class='p-4 border-2 border-green-200 dark:border-green-800 rounded-lg bg-green-50 dark:bg-green-950/30'><h4 class='font-bold text-lg mb-3'>Worked Example 2: Combining Rules</h4><p class='mb-2'><strong>Problem:</strong> Find the derivative of f(x) = 3x⁴ - 2x² + 7</p><div class='ml-4 space-y-2'><p><strong>Step 1:</strong> Apply sum rule - differentiate each term</p><p><strong>Step 2:</strong> First term: d/dx[3x⁴] = 3·4x³ = 12x³</p><p><strong>Step 3:</strong> Second term: d/dx[-2x²] = -2·2x = -4x</p><p><strong>Step 4:</strong> Third term: d/dx[7] = 0</p><p class='font-mono bg-white dark:bg-gray-900 p-2 rounded mt-2'>f'(x) = 12x³ - 4x</p></div></div>",
                durationEstimate: 65,
            },
        },
    },
    {
        id: "course_calc_101",
        slideid: "slide_3",
        chapterId: "chapter_1",
        title: "The Limit Definition",
        variants: {
            // text: {
            //     type: "text",
            //     content:
            //         "<div class='prose dark:prose-invert'><h3>Understanding the Limit Definition</h3><p>The derivative is formally defined using limits:</p><p class='font-mono bg-gray-100 dark:bg-gray-800 p-3 rounded my-3'>f'(x) = lim[h→0] (f(x+h) - f(x))/h</p><ul><li><strong>Numerator:</strong> Change in y-values (rise)</li><li><strong>Denominator:</strong> Change in x-values (run)</li><li><strong>Limit as h→0:</strong> Makes the interval infinitesimally small</li></ul><p class='mt-3'>This captures the exact slope at a single point, not just an average over an interval.</p></div>",
            //     durationEstimate: 50,
            // },
            visual: {
                type: "visual",
                content:
                    "<div class='p-4 bg-muted rounded-lg'><h3 class='text-lg font-bold mb-2'>Limit Definition Visualization</h3><div class='bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded p-6'><div class='text-center space-y-4'><p class='text-xl font-mono'>Δy/Δx → dy/dx</p><p class='text-sm text-gray-700 dark:text-gray-300'>As the interval shrinks...</p><svg width='250' height='150' viewBox='0 0 250 150' class='mx-auto mt-4'><path d='M 20 130 Q 80 50 240 20' stroke='currentColor' fill='none' stroke-width='2'/><line x1='100' y1='80' x2='160' y2='55' stroke='blue' stroke-width='2' stroke-dasharray='4'/><line x1='100' y1='80' x2='160' y2='80' stroke='green' stroke-width='1'/><line x1='160' y1='55' x2='160' y2='80' stroke='red' stroke-width='1'/><circle cx='100' cy='80' r='3' fill='blue'/><circle cx='160' cy='55' r='3' fill='blue'/><text x='130' y='95' font-size='10' fill='currentColor'>h→0</text></svg></div></div></div>",
                durationEstimate: 55,
            },
            example: {
                type: "example",
                content:
                    "<div class='p-4 border-2 border-purple-200 dark:border-purple-800 rounded-lg bg-purple-50 dark:bg-purple-950/30'><h4 class='font-bold text-lg mb-3'>Worked Example 3: Using the Limit Definition</h4><p class='mb-2'><strong>Problem:</strong> Find f'(x) for f(x) = x² using the limit definition</p><div class='ml-4 space-y-2'><p><strong>Step 1:</strong> Write the definition: f'(x) = lim[h→0] (f(x+h) - f(x))/h</p><p><strong>Step 2:</strong> Substitute: lim[h→0] ((x+h)² - x²)/h</p><p><strong>Step 3:</strong> Expand: lim[h→0] (x² + 2xh + h² - x²)/h</p><p><strong>Step 4:</strong> Simplify: lim[h→0] (2xh + h²)/h = lim[h→0] (2x + h)</p><p class='font-mono bg-white dark:bg-gray-900 p-2 rounded mt-2'>f'(x) = 2x</p></div></div>",
                durationEstimate: 75,
            },
        },
    },
    {
        id: "course_calc_101",
        slideid: "slide_4",
        chapterId: "chapter_1",
        title: "Derivative Notation",
        variants: {
            // text: {
            //     type: "text",
            //     content:
            //         "<div class='prose dark:prose-invert'><h3>Different Ways to Write Derivatives</h3><p>There are several common notations for derivatives, each with its own use:</p><ul><li><strong>Lagrange notation:</strong> f'(x) - emphasizes the derivative as a function</li><li><strong>Leibniz notation:</strong> dy/dx or df/dx - emphasizes the ratio of infinitesimals</li><li><strong>Newton notation:</strong> ẏ - used primarily in physics for time derivatives</li><li><strong>Euler notation:</strong> D<sub>x</sub>f - operator notation</li></ul><p class='mt-3'>All notations represent the same concept: the instantaneous rate of change.</p></div>",
            //     durationEstimate: 45,
            // },
            visual: {
                type: "visual",
                content:
                    "<div class='p-4 bg-muted rounded-lg'><h3 class='text-lg font-bold mb-2'>Notation Comparison</h3><div class='grid grid-cols-2 gap-3'><div class='p-4 bg-cyan-100 dark:bg-cyan-900/30 rounded'><p class='font-semibold text-cyan-800 dark:text-cyan-300 mb-2'>Lagrange</p><p class='text-2xl font-mono'>f'(x)</p><p class='text-xs mt-2'>Function-focused</p></div><div class='p-4 bg-teal-100 dark:bg-teal-900/30 rounded'><p class='font-semibold text-teal-800 dark:text-teal-300 mb-2'>Leibniz</p><p class='text-2xl font-mono'>dy/dx</p><p class='text-xs mt-2'>Ratio-focused</p></div><div class='p-4 bg-indigo-100 dark:bg-indigo-900/30 rounded'><p class='font-semibold text-indigo-800 dark:text-indigo-300 mb-2'>Newton</p><p class='text-2xl font-mono'>ẏ</p><p class='text-xs mt-2'>Physics notation</p></div><div class='p-4 bg-violet-100 dark:bg-violet-900/30 rounded'><p class='font-semibold text-violet-800 dark:text-violet-300 mb-2'>Euler</p><p class='text-2xl font-mono'>D<sub>x</sub>f</p><p class='text-xs mt-2'>Operator notation</p></div></div></div>",
                durationEstimate: 40,
            },
            example: {
                type: "example",
                content:
                    "<div class='p-4 border-2 border-cyan-200 dark:border-cyan-800 rounded-lg bg-cyan-50 dark:bg-cyan-950/30'><h4 class='font-bold text-lg mb-3'>Worked Example 4: Converting Between Notations</h4><p class='mb-2'><strong>Given:</strong> y = 3x² + 5x - 2</p><div class='ml-4 space-y-3'><p><strong>Lagrange notation:</strong></p><p class='font-mono bg-white dark:bg-gray-900 p-2 rounded'>f'(x) = 6x + 5</p><p><strong>Leibniz notation:</strong></p><p class='font-mono bg-white dark:bg-gray-900 p-2 rounded'>dy/dx = 6x + 5</p><p><strong>Alternative Leibniz:</strong></p><p class='font-mono bg-white dark:bg-gray-900 p-2 rounded'>d/dx[3x² + 5x - 2] = 6x + 5</p></div></div>",
                durationEstimate: 55,
            },
        },
    },
    {
        id: "course_calc_101",
        slideid: "slide_5",
        chapterId: "chapter_1",
        title: "Higher-Order Derivatives",
        variants: {
            // text: {
            //     type: "text",
            //     content:
            //         "<div class='prose dark:prose-invert'><h3>Second and Higher Derivatives</h3><p>The derivative of a derivative is called a higher-order derivative:</p><ul><li><strong>Second derivative:</strong> f''(x) or d²y/dx² - measures the rate of change of the rate of change</li><li><strong>Third derivative:</strong> f'''(x) or d³y/dx³ - and so on</li><li><strong>Physical meaning:</strong> If position = f(t), then velocity = f'(t) and acceleration = f''(t)</li></ul><p class='mt-3'>Higher-order derivatives help us understand concavity, inflection points, and acceleration.</p></div>",
            //     durationEstimate: 50,
            // },
            visual: {
                type: "visual",
                content:
                    "<div class='p-4 bg-muted rounded-lg'><h3 class='text-lg font-bold mb-2'>Higher-Order Derivatives</h3><div class='space-y-3'><div class='p-4 bg-orange-100 dark:bg-orange-900/30 rounded'><p class='font-semibold text-orange-800 dark:text-orange-300'>Position</p><p class='font-mono text-lg'>s(t) = t³</p></div><div class='flex items-center justify-center'><span class='text-2xl'>↓</span></div><div class='p-4 bg-amber-100 dark:bg-amber-900/30 rounded'><p class='font-semibold text-amber-800 dark:text-amber-300'>Velocity (1st derivative)</p><p class='font-mono text-lg'>v(t) = s'(t) = 3t²</p></div><div class='flex items-center justify-center'><span class='text-2xl'>↓</span></div><div class='p-4 bg-yellow-100 dark:bg-yellow-900/30 rounded'><p class='font-semibold text-yellow-800 dark:text-yellow-300'>Acceleration (2nd derivative)</p><p class='font-mono text-lg'>a(t) = s''(t) = 6t</p></div></div></div>",
                durationEstimate: 60,
            },
            example: {
                type: "example",
                content:
                    "<div class='p-4 border-2 border-orange-200 dark:border-orange-800 rounded-lg bg-orange-50 dark:bg-orange-950/30'><h4 class='font-bold text-lg mb-3'>Worked Example 5: Finding Second Derivatives</h4><p class='mb-2'><strong>Problem:</strong> Find f''(x) for f(x) = x⁴ - 3x² + 2</p><div class='ml-4 space-y-2'><p><strong>Step 1:</strong> Find the first derivative</p><p class='font-mono bg-white dark:bg-gray-900 p-2 rounded'>f'(x) = 4x³ - 6x</p><p><strong>Step 2:</strong> Differentiate again to get the second derivative</p><p class='font-mono bg-white dark:bg-gray-900 p-2 rounded'>f''(x) = 12x² - 6</p></div><p class='mt-3 text-sm text-gray-600 dark:text-gray-400'><strong>Interpretation:</strong> This tells us about the concavity of the original function.</p></div>",
                durationEstimate: 70,
            },
        },
    },
    {
        id: "course_calc_101", // This seems to be the course ID, but used as id here? Assuming consistency with prev schema
        slideid: "slide_1",
        chapterId: "chapter_2",
        title: "The Power Rule",
        variants: {
            text: {
                type: "text",
                content:
                    "<div class='prose dark:prose-invert'><h3>The Power Rule</h3><p>For any real number n, if f(x) = x^n, then f'(x) = nx^(n-1).</p><p class='mt-3'>This is one of the most fundamental and frequently used rules in calculus.</p></div>",
                durationEstimate: 30,
            },
            example: {
                type: "example",
                content:
                    "<div class='p-4 border-2 border-indigo-200 dark:border-indigo-800 rounded-lg bg-indigo-50 dark:bg-indigo-950/30'><h4 class='font-bold text-lg mb-3'>Worked Example 1: Basic Power Rule</h4><p class='mb-2'><strong>Problem:</strong> Find the derivative of f(x) = x⁵</p><div class='ml-4 space-y-2'><p><strong>Step 1:</strong> Identify n = 5</p><p><strong>Step 2:</strong> Apply the power rule: d/dx[x^n] = nx^(n-1)</p><p class='font-mono bg-white dark:bg-gray-900 p-2 rounded'>f'(x) = 5x^(5-1) = 5x⁴</p></div></div>",
                durationEstimate: 50,
            },
        },
    },
    {
        id: "course_calc_101",
        slideid: "slide_2",
        chapterId: "chapter_2",
        title: "Product Rule",
        variants: {
            text: {
                type: "text",
                content:
                    "<div class='prose dark:prose-invert'><h3>The Product Rule</h3><p>When differentiating the product of two functions, we use the product rule:</p><p class='font-mono bg-gray-100 dark:bg-gray-800 p-3 rounded my-3'>(f·g)' = f'·g + f·g'</p><p>In words: the derivative of the first times the second, plus the first times the derivative of the second.</p><p class='mt-3'><strong>Remember:</strong> You cannot simply multiply the derivatives of each function separately!</p></div>",
                durationEstimate: 45,
            },
            example: {
                type: "example",
                content:
                    "<div class='p-4 border-2 border-rose-200 dark:border-rose-800 rounded-lg bg-rose-50 dark:bg-rose-950/30'><h4 class='font-bold text-lg mb-3'>Worked Example 2: Applying Product Rule</h4><p class='mb-2'><strong>Problem:</strong> Find the derivative of h(x) = (x² + 1)(x³ - 2x)</p><div class='ml-4 space-y-2'><p><strong>Step 1:</strong> Identify f(x) = x² + 1 and g(x) = x³ - 2x</p><p><strong>Step 2:</strong> Find f'(x) = 2x and g'(x) = 3x² - 2</p><p><strong>Step 3:</strong> Apply product rule: f'·g + f·g'</p><p class='font-mono bg-white dark:bg-gray-900 p-2 rounded'>h'(x) = (2x)(x³ - 2x) + (x² + 1)(3x² - 2)</p><p><strong>Step 4:</strong> Simplify</p><p class='font-mono bg-white dark:bg-gray-900 p-2 rounded'>h'(x) = 5x⁴ + 3x² - 4x - 2</p></div></div>",
                durationEstimate: 80,
            },
        },
    },
    {
        id: "course_calc_101",
        slideid: "slide_3",
        chapterId: "chapter_2",
        title: "Quotient Rule",
        variants: {
            visual: {
                type: "visual",
                content:
                    "<div class='p-4 bg-muted rounded-lg'><h3 class='text-lg font-bold mb-2'>Quotient Rule Visual</h3><div class='bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 rounded p-6'><div class='text-center space-y-4'><p class='text-xl font-bold'>d/dx[f(x)/g(x)]</p><div class='text-3xl my-4'>=</div><div class='border-t-2 border-black dark:border-white inline-block px-6'><div class='py-2'><div class='font-mono mb-2'>g(x)·f'(x) - f(x)·g'(x)</div></div><div class='border-t-2 border-black dark:border-white pt-2'><div class='font-mono'>[g(x)]²</div></div></div><p class='text-sm mt-4 text-gray-600 dark:text-gray-400'>Lo·dHi - Hi·dLo over Lo²</p></div></div></div>",
                durationEstimate: 55,
            },
            example: {
                type: "example",
                content:
                    "<div class='p-4 border-2 border-emerald-200 dark:border-emerald-800 rounded-lg bg-emerald-50 dark:bg-emerald-950/30'><h4 class='font-bold text-lg mb-3'>Worked Example 3: Applying Quotient Rule</h4><p class='mb-2'><strong>Problem:</strong> Find the derivative of h(x) = (x² + 3)/(x - 1)</p><div class='ml-4 space-y-2'><p><strong>Step 1:</strong> Identify f(x) = x² + 3 (numerator) and g(x) = x - 1 (denominator)</p><p><strong>Step 2:</strong> Find f'(x) = 2x and g'(x) = 1</p><p><strong>Step 3:</strong> Apply quotient rule</p><p class='font-mono bg-white dark:bg-gray-900 p-2 rounded'>h'(x) = [(x-1)(2x) - (x²+3)(1)] / (x-1)²</p><p><strong>Step 4:</strong> Simplify</p><p class='font-mono bg-white dark:bg-gray-900 p-2 rounded'>h'(x) = (x² - 2x - 3) / (x-1)²</p></div></div>",
                durationEstimate: 85,
            },
        },
    },
    {
        id: "course_calc_101",
        slideid: "slide_4",
        chapterId: "chapter_2",
        title: "Chain Rule",
        variants: {
            visual: {
                type: "visual",
                content:
                    "<div class='p-4 bg-muted rounded-lg'><h3 class='text-lg font-bold mb-2'>Chain Rule Visual</h3><div class='bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 rounded p-6'><div class='text-center space-y-4'><div class='inline-block'><div class='p-3 bg-purple-200 dark:bg-purple-800 rounded-lg mb-2'><p class='font-bold'>Outer function: f</p></div><div class='p-3 bg-violet-200 dark:bg-violet-800 rounded-lg'><p class='font-bold'>Inner function: g(x)</p></div></div><div class='text-2xl my-4'>↓</div><p class='font-mono text-lg'>f'(g(x)) × g'(x)</p><div class='mt-4 grid grid-cols-2 gap-2 text-sm'><div class='p-2 bg-white/50 dark:bg-black/20 rounded'>Derivative of outer</div><div class='p-2 bg-white/50 dark:bg-black/20rounded'>Derivative of inner</div></div></div></div></div>",
                durationEstimate: 60,
            },
            example: {
                type: "example",
                content:
                    "<div class='p-4 border-2 border-violet-200 dark:border-violet-800 rounded-lg bg-violet-50 dark:bg-violet-950/30'><h4 class='font-bold text-lg mb-3'>Worked Example 4: Applying Chain Rule</h4><p class='mb-2'><strong>Problem:</strong> Find the derivative of h(x) = (3x² + 5)⁴</p><div class='ml-4 space-y-2'><p><strong>Step 1:</strong> Identify outer function f(u) = u⁴ and inner function u = g(x) = 3x² + 5</p><p><strong>Step 2:</strong> Find f'(u) = 4u³ and g'(x) = 6x</p><p><strong>Step 3:</strong> Apply chain rule: f'(g(x))·g'(x)</p><p class='font-mono bg-white dark:bg-gray-900 p-2 rounded'>h'(x) = 4(3x² + 5)³ · 6x</p><p><strong>Step 4:</strong> Simplify</p><p class='font-mono bg-white dark:bg-gray-900 p-2 rounded'>h'(x) = 24x(3x² + 5)³</p></div></div>",
                durationEstimate: 90,
            },
        },
    },
    {
        id: "course_calc_101",
        slideid: "slide_5",
        chapterId: "chapter_2",
        title: "Combining Differentiation Rules",
        variants: {
            visual: {
                type: "visual",
                content:
                    "<div class='p-4 bg-muted rounded-lg'><h3 class='text-lg font-bold mb-2'>Decision Tree for Rules</h3><div class='bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 rounded p-6'><div class='space-y-3 text-sm'><div class='p-3 bg-amber-200 dark:bg-amber-800 rounded font-bold text-center'>What operation is on the outside?</div><div class='grid grid-cols-2 gap-2'><div class='p-2 bg-white/70 dark:bg-black/30 rounded text-center'><p class='font-semibold'>Multiplication?</p><p class='text-xs mt-1'>→ Product Rule</p></div><div class='p-2 bg-white/70 dark:bg-black/30 rounded text-center'><p class='font-semibold'>Division?</p><p class='text-xs mt-1'>→ Quotient Rule</p></div><div class='p-2 bg-white/70 dark:bg-black/30 rounded text-center'><p class='font-semibold'>Composition?</p><p class='text-xs mt-1'>→ Chain Rule</p></div><div class='p-2 bg-white/70 dark:bg-black/30 rounded text-center'><p class='font-semibold'>Power?</p><p class='text-xs mt-1'>→ Power Rule</p></div></div></div></div></div>",
                durationEstimate: 55,
            },
            example: {
                type: "example",
                content:
                    "<div class='p-4 border-2 border-amber-200 dark:border-amber-800 rounded-lg bg-amber-50 dark:bg-amber-950/30'><h4 class='font-bold text-lg mb-3'>Worked Example 5: Multiple Rules</h4><p class='mb-2'><strong>Problem:</strong> Find the derivative of h(x) = x²·(2x + 1)³</p><div class='ml-4 space-y-2'><p><strong>Step 1:</strong> Recognize this is a product: f(x) = x² and g(x) = (2x + 1)³</p><p><strong>Step 2:</strong> Use product rule: f'·g + f·g'</p><p><strong>Step 3:</strong> Find f'(x) = 2x (power rule)</p><p><strong>Step 4:</strong> Find g'(x) = 3(2x+1)²·2 = 6(2x+1)² (chain rule)</p><p><strong>Step 5:</strong> Combine:</p><p class='font-mono bg-white dark:bg-gray-900 p-2 rounded'>h'(x) = 2x(2x+1)³ + x²·6(2x+1)²</p><p><strong>Step 6:</strong> Factor:</p><p class='font-mono bg-white dark:bg-gray-900 p-2 rounded'>h'(x) = 2x(2x+1)²[(2x+1) + 3x] = 2x(2x+1)²(5x+1)</p></div></div>",
                durationEstimate: 100,
            },
        },
    },
];

const MOCK_CHAPTERS: Chapter[] = [
    {
        id: "chapter_1",
        title: "Chapter 1: Foundations of Derivatives",
        slides: MOCK_SLIDES.filter((slide) => slide.chapterId === "chapter_1"), // Populate slides for this chapter
    },
    {
        id: "chapter_2",
        title: "Chapter 2: Derivative Rules",
        slides: MOCK_SLIDES.filter((slide) => slide.chapterId === "chapter_2"), // Populate slides for this chapter
    },
];


const MOCK_COURSE: Course = {
    id: "course_calc_101",
    title: "Calculus I: Limits & Derivatives",
    instructorId: "prof_smith",
    chapters: MOCK_CHAPTERS, // Use chapters instead of slides
};


const MOCK_COURSES: Course[] = [
    MOCK_COURSE,
    {
        id: "course_phys_101",
        title: "Physics 101: Mechanics",
        instructorId: "prof_doe",
        chapters: [], // Empty chapters for now
    },
    {
        id: "course_hist_200",
        title: "World History: 20th Century",
        instructorId: "prof_jones",
        chapters: [], // Empty chapters for now
    },
];

export class MockService {
    async getCurrentUser(): Promise<User> {
        await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate latency
        return MOCK_USER;
    }

    async getCourses(): Promise<Course[]> {
        await new Promise((resolve) => setTimeout(resolve, 600));
        return MOCK_COURSES;
    }

    async getCourse(courseId: string): Promise<Course> {
        await new Promise((resolve) => setTimeout(resolve, 800));
        return MOCK_COURSE;
    }

    async logEvent(event: LearningEvent): Promise<void> {
        console.log("[MockService] Event Logged:", event);
        await new Promise((resolve) => setTimeout(resolve, 200));
    }

    async updatePreferences(userId: string, preferences: Partial<User['preferences']>): Promise<void> {
        if (MOCK_USER.id === userId && MOCK_USER.preferences) {
            MOCK_USER.preferences = { ...MOCK_USER.preferences, ...preferences };
        }
        await new Promise((resolve) => setTimeout(resolve, 500));
    }
}