import { LicenseInfo, TCGCContext } from "./interfaces.js";

export const licenseMap: { [key: string]: LicenseInfo } = {
  "MIT License": {
    name: "MIT License",
    link: "https://mit-license.org",
    company: "",
    header: `Copyright (c) <company>. All rights reserved.
Licensed under the MIT License.`,
    description: `Copyright (c) <company>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the “Software”), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.`,
  },
  "Apache License 2.0": {
    name: "Apache License 2.0",
    link: "https://www.apache.org/licenses/LICENSE-2.0",
    company: "",
    header: `Copyright (c) <company>. All rights reserved.
Licensed under the Apache License, Version 2.0.`,
    description: `Copyright (c) <company>

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.`,
  },
  "BSD 3-Clause License": {
    name: "BSD 3-Clause License",
    link: "https://opensource.org/licenses/BSD-3-Clause",
    company: "",
    header: `Copyright (c) <company>. All rights reserved.
Licensed under the BSD 3-Clause License.`,
    description: `Copyright (c) <company>

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice,
   this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright
   notice, this list of conditions and the following disclaimer in the
   documentation and/or other materials provided with the distribution.

3. Neither the name of the copyright holder nor the
   names of its contributors may be used to endorse or promote products
   derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.`,
  },
  "MPL 2.0": {
    name: "MPL 2.0",
    link: "https://www.mozilla.org/en-US/MPL/2.0/",
    company: "",
    header: `Copyright (c) <company>. All rights reserved.
Licensed under the Mozilla Public License, v. 2.0.`,
    description: `Copyright (c) <company>

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.`,
  },
  "GPL-3.0": {
    name: "GPL-3.0",
    link: "https://www.gnu.org/licenses/gpl-3.0.html",
    company: "",
    header: `Copyright (c) <company>. All rights reserved.
Licensed under the version 3 of the GNU General Public License.`,
    description: `Copyright (c) <company>

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.`,
  },
  "LGPL-3.0": {
    name: "LGPL-3.0",
    link: "https://www.gnu.org/licenses/lgpl-3.0.html",
    company: "",
    header: `Copyright (c) <company>. All rights reserved.
Licensed under the version 3 of the GNU Lesser General Public License.`,
    description: `Copyright (c) <company>

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Lesser General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Lesser General Public License for more details.

You should have received a copy of the GNU Lesser General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.`,
  },
};

export function getLicenseInfo(context: TCGCContext): LicenseInfo | undefined {
  if (!context.license) {
    return undefined;
  }

  // if license name is not preset in TCGC, we will use user's config
  if (!Object.keys(licenseMap).includes(context.license.name)) {
    return {
      name: context.license.name,
      company: context.license.company ?? "",
      link: context.license.link ?? "",
      header: context.license.header ?? "",
      description: context.license.description ?? "",
    };
  }

  // use preset license info if no user customization
  const licenseInfo = licenseMap[context.license.name];
  return {
    name: licenseInfo.name,
    company: context.license.company ?? "",
    link: context.license.link ?? licenseInfo.link,
    header:
      context.license.header ??
      licenseInfo.header.replace("<company>", context.license.company ?? ""),
    description:
      context.license.description ??
      licenseInfo.description.replace("<company>", context.license.company ?? ""),
  };
}
