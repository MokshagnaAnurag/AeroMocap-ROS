# AeroMocap ROS (by Anurag)

### A general purpose motion capture system built from the ground up, used to autonomously fly multiple drones indoors

## Architectural Diagram
![](https://github.com/MokshagnaAnurag/Anurag-Mocap/blob/main/images/architecture.png?raw=true)

## Dependencies
Install the pseyepy python library from GitHub.

This project requires the sfm (structure from motion) OpenCV module, which requires you to compile OpenCV from source[^1]. This is a bit of a pain, but these links should help you get started: [SFM dependencies](https://docs.opencv.org/4.x/db/db8/tutorial_sfm_installation.html) [OpenCV module installation guide](https://github.com/opencv/opencv_contrib/blob/master/README.md)

[^1]: ⚠️ The experimental `no-cv-sfm` branch removes this OpenCV-SFM dependency, however it is *completely* untested. It is recommended to first try use the `main` branch which is tested.

install npm and yarn

## Running the code

From the computer_code directory Run `yarn install` to install node dependencies 

Then run `yarn run dev` to start the webserver. You will be given a url view the frontend interface.

In another terminal window, run `python3 api/index.py` to start the backend server. This is what receives the camera streams and does motion capture computations.

## Documentation
The documentation for this project is admittedly pretty lacking, if anyone would like to put type definitions in the Python code that would be amazing and probably go a long way to helping the readability of the code.

A discussion post explains how `camera_params.json` can be calculated for your cameras.

## "Inside-Out" Multi-Agent Tracking (SLAM)
This motion capture system is an "outside-in" system, with external cameras tracking objects within a fixed space. There are also "inside-out" systems which use cameras on the drones/robots to determine their locations, not requiring any external infrastructure. 

Check out the research here: [https://github.com/MokshagnaAnurag/distributed_visual_SLAM](https://github.com/MokshagnaAnurag/distributed_visual_SLAM)
