from manim import *

class GeneratedScene(Scene):
    def construct(self):
        # 1. Introduction - Title Text
        title = Text("The Power Rule", font_size=48, color=WHITE)
        title.to_edge(UP)
        self.play(Write(title))
        self.wait(0.5)

        # 2. Setup initial objects: d/dx (x^n)
        # Using simple Text objects for variables
        base_x = Text("x", font_size=120, color=BLUE)
        exponent_n = Text("n", font_size=80, color=YELLOW)
        operator = Text("d/dx", font_size=80, color=GREY)

        # Position objects manually
        base_x.move_to(ORIGIN)
        exponent_n.next_to(base_x, UP + RIGHT, buff=0.1)
        operator.next_to(base_x, LEFT, buff=1.0)

        # Create a group for the initial expression
        expression = VGroup(operator, base_x, exponent_n)
        self.play(FadeIn(expression))
        self.wait(1)

        # 3. The Power Rule Animation - Step 1: "n" moves to front
        # We create the result "n" that will appear in front
        front_n = Text("n", font_size=120, color=YELLOW)
        front_n.next_to(base_x, LEFT, buff=0.3)

        # Visual metaphor: Exponent n transforms into the multiplier n
        # Also fade out the derivative operator as the operation is performed
        self.play(
            ReplacementTransform(exponent_n, front_n),
            FadeOut(operator),
            run_time=1.5
        )
        self.wait(0.5)

        # 4. The Power Rule Animation - Step 2: New exponent "n-1" appears
        # Creating text for the decreased power
        new_exponent = Text("n-1", font_size=70, color=GREEN)
        new_exponent.next_to(base_x, UP + RIGHT, buff=0.1)

        # Animate the appearance of the new exponent
        self.play(FadeIn(new_exponent))
        self.wait(1)

        # 5. Highlight the final derivative rule
        # Create a box around the final result
        result_group = VGroup(front_n, base_x, new_exponent)
        highlight_box = Rectangle(color=PURPLE, height=3.0, width=6.5)
        highlight_box.move_to(result_group)
        
        # Add a simple annotation at the bottom
        annotation = Text("Power drops down, then subtract 1", font_size=32, color=ORANGE)
        annotation.to_edge(DOWN, buff=1.0)

        self.play(Create(highlight_box))
        self.play(Write(annotation))
        self.wait(3)

        # 6. Outro - Fade everything out
        self.play(
            FadeOut(title),
            FadeOut(result_group),
            FadeOut(highlight_box),
            FadeOut(annotation)
        )
        self.wait(1)