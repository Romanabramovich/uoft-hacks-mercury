import os
import subprocess
import tempfile
import uuid
from pathlib import Path
import google.generativeai as genai
from typing import Dict, Any, Optional, Literal
from dotenv import load_dotenv

load_dotenv()

# Configure Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# Manim output directory (should be accessible to frontend)
MANIM_OUTPUT_DIR = os.getenv("MANIM_OUTPUT_DIR", "./generated_animations")
Path(MANIM_OUTPUT_DIR).mkdir(parents=True, exist_ok=True)


class SlideGenerator:
    """
    Generates slide content using Gemini API based on user's learning identity
    """
    
    def __init__(self, model_name: str = "gemini-3-flash-preview"):
        if not GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY not found in environment variables")
        
        self.model = genai.GenerativeModel(model_name)
    
    def generate_slide_content(
        self,
        topic: str,
        learning_objectives: str,
        visual_text_score: float,
        context: Optional[str] = None,
        previous_content: Optional[str] = None,
        force_format: Optional[Literal["html", "manim"]] = None
    ) -> Dict[str, Any]:
        """
        Generate slide content on a continuous spectrum between visual and text
        
        Args:
            topic: The topic/title of the slide
            learning_objectives: What the student should learn from this slide
            visual_text_score: 0.0 (pure text) to 1.0 (pure visual) - continuous range
            context: Additional context about the course/chapter
            previous_content: Previous slide content for continuity
            force_format: Force specific output format (html or manim)
        
        Returns:
            Dict with generated content, metadata, and format type
        """
        # Determine output format based on visual_text_score
        # High visual scores (>0.6) should generate Manim animations
        should_use_manim = visual_text_score > 0.6 if force_format is None else force_format == "manim"
        
        if should_use_manim:
            return self._generate_manim_animation(
                topic=topic,
                learning_objectives=learning_objectives,
                visual_text_score=visual_text_score,
                context=context,
                previous_content=previous_content
            )
        else:
            return self._generate_html_content(
                topic=topic,
                learning_objectives=learning_objectives,
                visual_text_score=visual_text_score,
                context=context,
                previous_content=previous_content
            )
    
    def _generate_html_content(
        self,
        topic: str,
        learning_objectives: str,
        visual_text_score: float,
        context: Optional[str],
        previous_content: Optional[str]
    ) -> Dict[str, Any]:
        """Generate HTML-based slide content for text-heavy slides"""
        prompt = self._build_html_prompt(
            topic=topic,
            learning_objectives=learning_objectives,
            visual_text_score=visual_text_score,
            context=context,
            previous_content=previous_content
        )
        
        try:
            response = self.model.generate_content(prompt)
            
            # Validate response
            if not response or not hasattr(response, 'text'):
                raise ValueError("Empty or invalid response from Gemini API")
            
            generated_text = response.text
            
            # Validate content length
            if len(generated_text.strip()) < 50:
                raise ValueError(f"Generated content too short: {len(generated_text)} characters")
            
            # Validate it's actual HTML content (basic check)
            if '<' not in generated_text or '>' not in generated_text:
                # Wrap plain text in basic HTML
                generated_text = f"<div class='slide-content'><h2>{topic}</h2><p>{generated_text}</p></div>"
            
            result = {
                "content": generated_text,
                "content_type": "html",
                "visual_text_score": visual_text_score,
                "topic": topic,
                "metadata": {
                    "generated_by": "gemini",
                    "model": self.model._model_name,
                    "format": "html",
                    "prompt_tokens": response.usage_metadata.prompt_token_count if hasattr(response, 'usage_metadata') else None,
                    "response_tokens": response.usage_metadata.candidates_token_count if hasattr(response, 'usage_metadata') else None
                }
            }
            
            # Validate content quality
            if not self._validate_generated_content(generated_text, "html", topic):
                raise ValueError("Generated content failed quality validation")
            
            return result
        
        except Exception as e:
            error_msg = str(e)
            print(f"Generation error: {error_msg}")
            
            # Return fallback content instead of failing completely
            fallback_content = self._generate_fallback_content(topic, learning_objectives, visual_text_score)
            
            raise RuntimeError(f"Failed to generate HTML content: {error_msg}")
    
    def _generate_manim_animation(
        self,
        topic: str,
        learning_objectives: str,
        visual_text_score: float,
        context: Optional[str],
        previous_content: Optional[str]
    ) -> Dict[str, Any]:
        """Generate Manim animation for visual-heavy slides"""
        prompt = self._build_manim_prompt(
            topic=topic,
            learning_objectives=learning_objectives,
            visual_text_score=visual_text_score,
            context=context,
            previous_content=previous_content
        )
        
        try:
            response = self.model.generate_content(prompt)
            manim_code = response.text
            
            # Extract Python code from markdown code blocks if present
            manim_code = self._extract_code_from_markdown(manim_code)
            
            # Render the Manim animation
            video_path, thumbnail_path = self._render_manim(manim_code, topic)
            
            return {
                "content": manim_code,
                "content_type": "manim",
                "video_url": f"/animations/{Path(video_path).name}",
                "thumbnail_url": f"/animations/{Path(thumbnail_path).name}" if thumbnail_path else None,
                "visual_text_score": visual_text_score,
                "topic": topic,
                "metadata": {
                    "generated_by": "gemini",
                    "model": self.model._model_name,
                    "format": "manim",
                    "video_path": video_path,
                    "prompt_tokens": response.usage_metadata.prompt_token_count if hasattr(response, 'usage_metadata') else None,
                    "response_tokens": response.usage_metadata.candidates_token_count if hasattr(response, 'usage_metadata') else None
                }
            }
        
        except Exception as e:
            raise RuntimeError(f"Failed to generate Manim animation: {str(e)}")
    
    def _build_html_prompt(
        self,
        topic: str,
        learning_objectives: str,
        visual_text_score: float,
        context: Optional[str],
        previous_content: Optional[str]
    ) -> str:
        """
        Build HTML generation prompt for text-heavy slides
        
        Used when visual_text_score <= 0.6
        """
        
        # Determine content style based on score
        if visual_text_score < 0.3:
            style_instruction = """
Generate content that is TEXT-HEAVY and DEFINITION-FOCUSED:
- Use clear, structured definitions
- Break concepts into bullet points
- Include detailed textual explanations
- Minimal visual descriptions (only if absolutely necessary)
- Focus on precise vocabulary and terminology
- Use numbered lists for step-by-step processes
"""
        elif visual_text_score < 0.5:
            style_instruction = """
Generate content with a BALANCED MIX of text and visual descriptions:
- Start with a concise definition
- Include a simple diagram description (describe what the diagram would show, if it is a diagram-heavy slide)
- Use bullet points for key concepts
- Add a worked example with step-by-step text
- Balance explanation with visual references
"""
        elif visual_text_score < 0.7:
            style_instruction = """
Generate content that is VISUAL-HEAVY with supporting text:
- Lead with diagram/flowchart descriptions (describe the visual in detail)
- Use minimal text to label and annotate
- Describe concept maps showing relationships
- Include infographic-style layouts (describe the visual structure)
- Keep textual explanations brief and to-the-point
"""
        else:
            style_instruction = """
Generate content that is PURELY VISUAL with MINIMAL TEXT:
- Focus entirely on describing visual representations
- Create detailed descriptions of diagrams, flowcharts, and concept maps
- Use visual metaphors and analogies
- Minimal explanatory text (only essential labels)
- Describe color-coded elements and visual hierarchies
- Think infographic-style with icons and visual symbols
"""
        
        # Build the full prompt
        prompt = f"""You are an expert educational content generator. Create lecture slide content for a lecture.

**Topic:** {topic}

**Learning Objectives:** {learning_objectives}

{f"**Course Context:** {context}" if context else ""}

{f"**Previous Slide Content (for continuity):** {previous_content}" if previous_content else ""}

**Content Style Requirements (VISUAL-TEXT SPECTRUM Score: {visual_text_score:.2f}):**
{style_instruction}

**Output Format:**
Generate the slide content as HTML that can be rendered directly. Include:
1. A clear title or heading (use <h2> or <h3> tags)
2. Main content following the style instructions above
3. For visual elements, use detailed placeholder descriptions like:
   - [DIAGRAM: description of what the diagram shows]
   - [FLOWCHART: step-by-step flow description]
   - [GRAPH: description of axes, curves, and important points]
4. Keep content concise and focused (aim for 150-250 words maximum)
5. Content should fit within a single slide viewport (no excessive scrolling)

**Length Constraints (CRITICAL):**
- Maximum 3-4 main bullet points or sections
- Each section should be 2-3 sentences maximum
- Total content should be readable in 2-3 minutes
- Focus on KEY concepts only - avoid excessive detail
- Think "slide deck" not "textbook chapter"

**Additional Guidelines:**
- Ensure content is pedagogically sound and academically rigorous
- Match the cognitive style indicated by the visual-text score
- Use proper semantic HTML tags (h2, h3, p, ul, li, div, strong, em, etc.)
- Maintain educational value while adapting to the preferred learning style
- Do NOT generate code, equations should use standard notation within text
- Keep paragraphs short (2-4 lines maximum)
- Use whitespace effectively for readability

Generate the HTML content now:"""
        
        return prompt
    
    def _generate_fallback_content(
        self,
        topic: str,
        learning_objectives: str,
        visual_text_score: float
    ) -> Dict[str, Any]:
        """
        Generate basic fallback content when LLM fails.
        This ensures students always get SOME content rather than a blank slide.
        """
        # Create structured fallback based on learning objectives
        content = f"""
        <div class="fallback-slide-content p-8">
            <h2 class="text-2xl font-bold mb-6 text-blue-400">{topic}</h2>
            
            <div class="mb-6">
                <h3 class="text-lg font-semibold mb-3 text-zinc-300">Learning Objectives</h3>
                <p class="text-zinc-400 leading-relaxed">{learning_objectives}</p>
            </div>
            
            <div class="mb-6">
                <h3 class="text-lg font-semibold mb-3 text-zinc-300">Key Concepts</h3>
                <ul class="list-disc list-inside space-y-2 text-zinc-400">
                    <li>This content is being prepared for your learning style</li>
                    <li>Please try refreshing the page or contact support if this persists</li>
                </ul>
            </div>
            
            <div class="mt-8 p-4 bg-yellow-900/20 border border-yellow-700/50 rounded">
                <p class="text-sm text-yellow-400">
                    ⚠️ Note: This is fallback content. Full personalized content will be generated shortly.
                </p>
            </div>
        </div>
        """
        
        return {
            "content": content.strip(),
            "content_type": "html",
            "visual_text_score": visual_text_score,
            "topic": topic,
            "metadata": {
                "generated_by": "fallback",
                "is_fallback": True,
                "format": "html"
            }
        }
    
    def _build_manim_prompt(
        self,
        topic: str,
        learning_objectives: str,
        visual_text_score: float,
        context: Optional[str],
        previous_content: Optional[str]
    ) -> str:
        """
        Build Manim generation prompt for visual-heavy animated slides
        
        Used when visual_text_score > 0.6
        """
        
        prompt = f"""You are an expert Manim animation developer. Create a simple, short Manim animation for educational content with visual understanding in mind.

**Topic:** {topic}

**Learning Objectives:** {learning_objectives}

{f"**Course Context:** {context}" if context else ""}

{f"**Previous Content (for continuity):** {previous_content}" if previous_content else ""}

**Animation Style (Visual Score: {visual_text_score:.2f}):**
Create a visually-rich animated explanation using Manim library. The animation should:
- Use dynamic transformations and morphing
- Include color-coded elements for clarity
- Show step-by-step visual progression
- Use arrows, highlights, and annotations
- Create engaging visual metaphors
- Minimize text, maximize visual communication

**Code Requirements:**
1. Create a single Scene class named "GeneratedScene"
2. Use Manim Community Edition (manim) syntax
3. Include proper imports: from manim import *
4. Animation should be 5 - 20 seconds long
5. Use high-quality rendering settings
6. Include clear visual transitions
7. Add minimal text labels where necessary

**ALLOWED Manim Methods ONLY:**
- Text() - for all text
- Circle(), Square(), Rectangle(), Line(), Dot(), Arrow(), Arc()
- Create(), Write(), FadeIn(), FadeOut(), Transform(), ReplacementTransform()
- VGroup() to group objects
- Colors: BLUE, RED, GREEN, YELLOW, PURPLE, ORANGE, WHITE, GREY
- .move_to(), .shift(), .scale(), .rotate(), .next_to(), .to_edge()
- self.play(), self.wait()

**FORBIDDEN Methods (will cause errors):**
- Tex(), MathTex() - LaTeX not installed
- Axes(), NumberPlane() with complex methods like .get_tangent_line_from_function()
- ParametricFunction() or advanced math functions
- Any method not listed above
- Complex updaters or trackers

**Animation Strategy:**
- Keep it SIMPLE with basic shapes and text
- Use geometric primitives (circles, squares, arrows) to explain concepts
- Animate transformations between shapes
- Use colors and motion to convey meaning
- NO complex mathematical plotting

**SAFE Example Structure:**
```python
from manim import *

class GeneratedScene(Scene):
    def construct(self):
        # Title (simple text only)
        title = Text("Topic Title", font_size=40, color=BLUE)
        self.play(Write(title))
        self.wait(1)
        self.play(FadeOut(title))
        
        # Visual concept with shapes
        shape1 = Circle(radius=1, color=RED)
        shape2 = Square(side_length=2, color=GREEN).shift(RIGHT * 3)
        
        self.play(Create(shape1))
        self.wait(0.5)
        self.play(Create(shape2))
        self.wait(0.5)
        
        # Transform to show relationship
        self.play(Transform(shape1, shape2))
        self.wait(1)
        
        # Add labels with Text() only
        label = Text("Key Concept", font_size=30, color=YELLOW)
        label.to_edge(DOWN)
        self.play(Write(label))
        self.wait(2)
        
        # Fade out
        self.play(FadeOut(shape1), FadeOut(shape2), FadeOut(label))
        self.wait(0.5)
```

**REMEMBER:**
- Use ONLY the allowed methods listed above
- Keep animations under 15 seconds
- Test each line mentally before including it
- Prefer simple over complex

**ABSOLUTELY REQUIRED:**
1. Use ONLY basic shapes: Circle, Square, Rectangle, Line, Dot, Arrow
2. Use ONLY Text() for any text - NO Tex() or MathTex()
3. Use ONLY simple methods: Create(), Write(), FadeIn(), FadeOut(), Transform()
4. DO NOT use Axes(), NumberPlane(), or plot() methods
5. DO NOT use ValueTracker() or updaters
6. Keep animations simple - under 10 self.play() calls
7. Every variable must be defined before use
8. Test that the code is complete and syntactically correct

**Final Check:**
- No Tex() or MathTex()? ✓
- No Axes() or NumberPlane()? ✓
- No plot() or graph functions? ✓
- Only basic shapes and text? ✓
- Simple animations only? ✓

Generate ONLY the Python code (no markdown, no explanations, just code starting with "from manim import *"):"""
        
        return prompt
    
    def _validate_generated_content(self, content: str, content_type: str, topic: str) -> bool:
        """
        Validate generated content meets minimum quality standards.
        Returns True if valid, False otherwise.
        """
        if not content or len(content.strip()) < 50:
            print(f"❌ Content too short: {len(content)} chars")
            return False
        
        if content_type == "html":
            # Check for basic HTML structure
            if '<' not in content or '>' not in content:
                print(f"❌ Missing HTML tags")
                return False
            
            # Check for topic presence (content should mention the topic)
            topic_words = topic.lower().split()
            content_lower = content.lower()
            matches = sum(1 for word in topic_words if word in content_lower and len(word) > 3)
            
            if matches == 0:
                print(f"❌ Topic '{topic}' not found in content")
                return False
        
        elif content_type == "manim":
            # Check for required Manim structure
            required_patterns = [
                "from manim import",
                "class GeneratedScene",
                "def construct(self)"
            ]
            
            for pattern in required_patterns:
                if pattern not in content:
                    print(f"❌ Missing required Manim pattern: {pattern}")
                    return False
        
        print(f"✓ Content validation passed for '{topic}'")
        return True
    
    def _extract_code_from_markdown(self, text: str) -> str:
        """Extract Python code from markdown code blocks"""
        import re
        
        # Look for ```python ... ``` blocks
        pattern = r'```python\s*(.*?)\s*```'
        matches = re.findall(pattern, text, re.DOTALL)
        
        if matches:
            return matches[0].strip()
        
        # Look for ``` ... ``` blocks (no language specified)
        pattern = r'```\s*(.*?)\s*```'
        matches = re.findall(pattern, text, re.DOTALL)
        
        if matches:
            return matches[0].strip()
        
        # No code blocks found, return as-is
        return text.strip()
    
    def _render_manim(self, manim_code: str, topic: str) -> tuple[str, Optional[str]]:
        """
        Render Manim code to video file
        
        Args:
            manim_code: Python code containing Manim scene
            topic: Topic name for file naming
        
        Returns:
            Tuple of (video_path, thumbnail_path)
        """
        # Generate unique filename
        file_id = str(uuid.uuid4())[:8]
        safe_topic = "".join(c for c in topic if c.isalnum() or c in (' ', '-', '_')).strip()[:50]
        base_name = f"{safe_topic}_{file_id}".replace(" ", "_")
        
        # Save generated code to debug directory for inspection
        debug_dir = Path(MANIM_OUTPUT_DIR) / "debug"
        debug_dir.mkdir(parents=True, exist_ok=True)
        debug_file = debug_dir / f"{base_name}.py"
        
        with open(debug_file, 'w', encoding='utf-8') as f:
            f.write(manim_code)
        
        # Create temporary Python file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False, encoding='utf-8') as f:
            f.write(manim_code)
            temp_script = f.name
        
        try:
            # Render with Manim
            # -ql = low quality for faster rendering (change to -qh for high quality)
            # --disable_caching to avoid cache issues
            cmd = [
                "manim",
                "-ql",  # Low quality (480p, 15fps) - change to -qh for production
                "--format=mp4",
                "--disable_caching",
                f"--output_file={base_name}",
                f"--media_dir={MANIM_OUTPUT_DIR}",
                temp_script,
                "GeneratedScene"
            ]
            
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=180,  # 3 minute timeout for complex animations
                creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if os.name == 'nt' else 0
            )
            
            if result.returncode != 0:
                error_msg = f"Manim rendering failed.\nStderr: {result.stderr}\nStdout: {result.stdout}\nCode saved to: {debug_file}"
                raise RuntimeError(error_msg)
            
            # Find the generated video file
            # Manim creates: {media_dir}/videos/{script_name}/{quality}/{output_file}.mp4
            script_stem = Path(temp_script).stem
            possible_paths = [
                Path(MANIM_OUTPUT_DIR) / "videos" / script_stem / "480p15" / f"{base_name}.mp4",
                Path(MANIM_OUTPUT_DIR) / "videos" / script_stem / "480p15" / "GeneratedScene.mp4",
                Path(MANIM_OUTPUT_DIR) / f"{base_name}.mp4",
            ]
            
            video_path = None
            for path in possible_paths:
                if path.exists():
                    video_path = path
                    break
            
            if not video_path or not video_path.exists():
                # List what was actually created for debugging
                media_dir = Path(MANIM_OUTPUT_DIR)
                if media_dir.exists():
                    all_files = list(media_dir.rglob("*.mp4"))
                    files_str = "\n".join([str(f) for f in all_files[:10]])
                    raise RuntimeError(
                        f"Generated video not found at expected locations.\n"
                        f"Tried: {[str(p) for p in possible_paths]}\n"
                        f"Found MP4 files: {files_str}\n"
                        f"Code saved to: {debug_file}"
                    )
                else:
                    raise RuntimeError(f"Media directory not created: {media_dir}")
            
            # Generate thumbnail (first frame)
            thumbnail_path = self._generate_thumbnail(video_path)
            
            return str(video_path), thumbnail_path
        
        finally:
            # Cleanup temp file
            try:
                os.unlink(temp_script)
            except:
                pass
    
    def _generate_thumbnail(self, video_path: Path) -> Optional[str]:
        """Generate thumbnail from video first frame using ffmpeg"""
        try:
            thumbnail_path = video_path.parent / f"{video_path.stem}_thumb.jpg"
            
            cmd = [
                "ffmpeg",
                "-i", str(video_path),
                "-ss", "00:00:00",
                "-vframes", "1",
                "-y",  # Overwrite output file
                str(thumbnail_path)
            ]
            
            result = subprocess.run(cmd, capture_output=True, timeout=10)
            
            if result.returncode == 0 and thumbnail_path.exists():
                return str(thumbnail_path)
            
        except Exception as e:
            print(f"Failed to generate thumbnail: {e}")
        
        return None


# Singleton instance
_generator_instance: Optional[SlideGenerator] = None


def get_slide_generator() -> SlideGenerator:
    """
    Get or create the slide generator singleton instance
    """
    global _generator_instance
    
    if _generator_instance is None:
        try:
            _generator_instance = SlideGenerator()
        except ValueError as e:
            # API key not configured
            raise RuntimeError(f"Slide generator not available: {str(e)}")
    
    return _generator_instance
