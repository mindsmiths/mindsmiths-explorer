# Change Log

All notable changes to the "mindsmiths-explorer" extension will be documented in this file.


## [Unreleased]


## [0.0.2] - 2022-12-23

### Changed
- Instead of port numbers, the ports widget now displays service names

### Fixed
- Plugin detects if the platform is already running by checking for `forge run` process instead of a cluster of keywords

### Removed
- Support for command `Mindsmiths: Force Stop` since `Mindsmiths: Stop` is now able to kill the process tree


## [0.0.1] - 2022-11-18

### Added
- Initial release of "mindsmiths-explorer"
- Supports widget that displays open ports while running the platform
- Supports commands:
  - `Mindsmiths: Init`
  - `Mindsmiths: Install`
  - `Mindsmiths: Run`
  - `Mindsmiths: Toggle Run`
  - `Mindsmiths: Stop`
  - `Mindsmiths: Force Stop`
  - `Mindsmiths: Reset`
- Autodetection which terminal should be used for running the commands