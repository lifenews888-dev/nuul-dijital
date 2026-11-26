export type Testimonial = {
  quote: string;
  author: string;
  role: string;
  company: string;
  rating: number;
  avatar: string;
};

// Real client testimonials are added from the admin panel.
export const testimonials: Testimonial[] = [];
