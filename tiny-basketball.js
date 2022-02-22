import { defs, tiny } from "./examples/common.js";

const {
  Vector,
  Vector3,
  vec,
  vec3,
  vec4,
  color,
  hex_color,
  Shader,
  Matrix,
  Mat4,
  Light,
  Shape,
  Material,
  Scene,
  Texture,
} = tiny;

const COLORS = {
  white: hex_color("#ffffff"),
  red: hex_color("#ff0000"),
};
export class TinyBasketball extends Scene {
  /**
   *  **Base_scene** is a Scene that can be added to any display canvas.
   *  Setup the shapes, materials, camera, and lighting here.
   */
  constructor() {
    // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
    super();

    // Shapes
    this.shapes = {
      basketball: new defs.Subdivision_Sphere(4),
      basketball_stripe: new defs.Surface_Of_Revolution(
        20,
        20,
        Vector3.cast([0, 1, 1], [0, 1, -1])
      ),
      ground: new defs.Square(),
      wall1: new defs.Square(),
      wall2: new defs.Square(),
      backboard: new defs.Square(),
      backboard_hoop: new defs.Cylindrical_Tube(3, 15),
      backboard_pole: new defs.Cylindrical_Tube(3, 15),
    };

    this.shapes.wall2.arrays.texture_coord = [];
    this.shapes.wall1.arrays.texture_coord.forEach((x, i) => {
      const next = new Vector(this.shapes.wall1.arrays.texture_coord[i]);
      next.scale_by(11);
      this.shapes.wall2.arrays.texture_coord.push(next);
    });

    // Materials
    this.materials = {
      phong: new Material(new defs.Textured_Phong(), {
        color: hex_color("#FFFFFF"),
      }),
      basketball: new Material(new defs.Phong_Shader(), {
        color: hex_color("#F88158"),
      }),
      basketball_stripe: new Material(new defs.Phong_Shader(), {
        color: hex_color("#000000"),
      }),
      wall_texture: new Material(new defs.Textured_Phong(), {
        color: hex_color("#000000"),
        ambient: 1,
        texture: new Texture("assets/brick-wall.jpeg"),
      }),
      ground_texture: new Material(new defs.Textured_Phong(), {
        color: hex_color("#ffffff"),
      }),
    };

    /* Other Scene Variables */
    // Camera location
    this.initial_camera_location = Mat4.look_at(
      vec3(0, 10, 20),
      vec3(0, 0, 0),
      vec3(0, 1, 0)
    );

    console.log("Sus");
  }

  make_control_panel() {}

  display(context, program_state) {
    if (!context.scratchpad.controls) {
      this.children.push(
        (context.scratchpad.controls = new defs.Movement_Controls())
      );
      // Define the global camera and projection matrices, which are stored in program_state.
      program_state.set_camera(Mat4.translation(0, 0, -8));
    }

    program_state.projection_transform = Mat4.perspective(
      Math.PI / 4,
      context.width / context.height,
      1,
      100
    );

    const light_position = vec4(10, 10, 10, 1);
    program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 1000)];

    this.dt = program_state.animation_delta_time / 1000;

    //
    // BASKETBALL
    //
    let model_transform = Mat4.identity();
    model_transform = model_transform.times(Mat4.scale(1, 1, 1));
    this.shapes.basketball.draw(
      context,
      program_state,
      model_transform,
      this.materials.basketball
    );

    let stripe_matrices = [
      Mat4.rotation(Math.PI / 2, 0, 1, 0).times(Mat4.scale(1.02, 1.02, 0.03)),
      Mat4.rotation(Math.PI / 2, 1, 0, 0).times(Mat4.scale(1.02, 1.02, 0.03)),
      Mat4.rotation(Math.PI / 4, 0, 0, 1)
        .times(Mat4.rotation(Math.PI / 2, 0, 1, 0))
        .times(Mat4.scale(1.02, 1.02, 0.03)),
      Mat4.rotation(-Math.PI / 4, 0, 0, 1)
        .times(Mat4.rotation(Math.PI / 2, 0, 1, 0))
        .times(Mat4.scale(1.02, 1.02, 0.03)),
    ];

    for (let i = 0; i < stripe_matrices.length; i++) {
      this.shapes.basketball_stripe.draw(
        context,
        program_state,
        stripe_matrices[i],
        this.materials.basketball_stripe
      );
    }

    // WALL
    let wall_transform = Mat4.identity();
    wall_transform = wall_transform.times(Mat4.translation(0, 0, -10));
    wall_transform = wall_transform.times(Mat4.scale(14, 10, 0.1));
    this.shapes.wall2.draw(
      context,
      program_state,
      wall_transform,
      this.materials.wall_texture
    );

    // GROUND
    let ground_transform = Mat4.identity();
    ground_transform = ground_transform
      .times(Mat4.translation(0, -10, 0))
      .times(Mat4.scale(14, 1, 14))
      .times(Mat4.rotation((3 * Math.PI) / 2, 1, 0, 0));
    this.shapes.ground.draw(
      context,
      program_state,
      ground_transform,
      this.materials.phong
    );

    this.draw_backboard(context, program_state);
  }

  draw_backboard(context, program_state) {
    let backboard_loc = Mat4.identity().times(Mat4.translation(0, 6, -8.5));
    this.shapes.backboard.draw(
      context,
      program_state,
      backboard_loc.times(Mat4.scale(2.5, 2, 2)),
      this.materials.phong
    );
    let hoop_loc = backboard_loc
      .times(Mat4.rotation(Math.PI / 2, 1, 0, 0))
      .times(Mat4.translation(0, 1, 1.5));
    this.shapes.backboard_hoop.draw(
      context,
      program_state,
      hoop_loc,
      this.materials.phong.override({ color: COLORS.red })
    );
    let pole_loc = backboard_loc
      .times(Mat4.scale(25, 1, 1))
      .times(Mat4.rotation(Math.PI / 2, 0, 1, 0))
      .times(Mat4.translation(1, 0, 0));
    this.shapes.backboard_pole.draw(
      context,
      program_state,
      pole_loc,
      this.materials.phong.override({ color: COLORS.red })
    );
  }
}
