from manim import *

class GeneratedScene(Scene):
    def construct(self):
        # 1. Title and Header
        title = Text("Product Rule Visualized", font_size=40, color=WHITE)
        self.play(Write(title))
        self.wait(1)
        
        # Shrink and move title to the top
        title_top = Text("Product Rule Visualized", font_size=28, color=WHITE).to_edge(UP)
        self.play(Transform(title, title_top))
        self.wait(0.5)

        # 2. Representing functions as sides of a rectangle
        # Area A = f * g
        base_rect = Rectangle(width=4.0, height=2.5, color=GREY)
        label_f = Text("f", color=BLUE).next_to(base_rect, LEFT)
        label_g = Text("g", color=RED).next_to(base_rect, BOTTOM)
        
        self.play(Create(base_rect))
        self.play(Write(label_f), Write(label_g))
        self.wait(1)

        # 3. Visualizing change in f (the derivative f')
        # We increase the height of the rectangle
        f_prime_strip = Rectangle(width=4.0, height=0.6, color=BLUE)
        f_prime_strip.next_to(base_rect, UP, buff=0)
        label_df = Text("f' * g", font_size=24, color=BLUE).move_to(f_prime_strip)
        
        # 4. Visualizing change in g (the derivative g')
        # We increase the width of the rectangle
        g_prime_strip = Rectangle(width=0.6, height=2.5, color=RED)
        g_prime_strip.next_to(base_rect, RIGHT, buff=0)
        label_dg = Text("g' * f", font_size=24, color=RED).move_to(g_prime_strip)

        # Animation of growth
        self.play(Create(f_prime_strip), Write(label_df))
        self.wait(0.5)
        self.play(Create(g_prime_strip), Write(label_dg))
        self.wait(1)

        # 5. Connecting visuals to the mathematical rule
        # The total change in area is the sum of the two new strips
        rule_text = Text("(f * g)' = f'g + g'f", font_size=42, color=YELLOW)
        rule_text.to_edge(DOWN)
        
        # Visual highlight
        bg_rect = Rectangle(width=rule_text.width + 0.5, height=rule_text.height + 0.5, color=YELLOW)
        bg_rect.move_to(rule_text)
        
        self.play(Write(rule_text))
        self.play(Create(bg_rect))
        self.wait(2)

        # 6. Exit
        # Group everything to fade out
        final_group = VGroup(
            title, base_rect, label_f, label_g, 
            f_prime_strip, label_df, g_prime_strip, label_dg, 
            rule_text, bg_rect
        )
        self.play(FadeOut(final_group))
        self.wait(1)